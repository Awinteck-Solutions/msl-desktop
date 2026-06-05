import { useEffect, useState } from "react";
import {
  Box,
  Select,
  Text,
  Spinner,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { userCourseList, singleCourse } from "../../Services/CourseApi";
import { useMslAi } from "../../Context/MslAiContext";
import { normalizeS3Key } from "../../utils/s3Key";

export default function MslAiScopePicker({ onScopeChange }) {
  const { scope, setAiScope } = useMslAi();
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [courseId, setCourseId] = useState(scope.courseId || "");
  const [lessonId, setLessonId] = useState(scope.lessonId || "");

  useEffect(() => {
    setCourseId(scope.courseId || "");
    setLessonId(scope.lessonId || "");
  }, [scope.courseId, scope.lessonId]);

  useEffect(() => {
    userCourseList()
      .then((res) => {
        if (res?.response) setCourses(res.response || []);
      })
      .finally(() => setLoadingCourses(false));
  }, []);

  useEffect(() => {
    if (!courseId) {
      setLessons([]);
      return;
    }
    setLoadingLessons(true);
    singleCourse(courseId)
      .then((res) => {
        const list =
          res.response?.response?.lessons ||
          res.response?.response?.response?.lessons ||
          res.response?.lessons ||
          [];
        setLessons(list);
      })
      .finally(() => setLoadingLessons(false));
  }, [courseId]);

  const applyScope = (cId, lId, lesson) => {
    const s3Keys = [];
    if (lesson?.pdf) s3Keys.push(normalizeS3Key(lesson.pdf));
    const next = {
      courseId: cId || null,
      lessonId: lId || null,
      s3Keys,
      label: lesson?.title || courses.find((c) => String(c._id) === cId)?.title || "Selected scope",
      source: "picker",
    };
    setAiScope(next);
    onScopeChange?.(next);
  };

  if (loadingCourses) {
    return <Spinner size="sm" />;
  }

  return (
    <Box className="space-y-3 p-3 bg-gray-50 rounded-lg border">
      <Text fontSize="sm" fontWeight="medium" color="gray.700">
        Content scope
      </Text>
      <FormControl size="sm">
        <FormLabel fontSize="xs">Course</FormLabel>
        <Select
          size="sm"
          placeholder="Select course"
          value={courseId}
          onChange={(e) => {
            const val = e.target.value;
            setCourseId(val);
            setLessonId("");
            applyScope(val, "", null);
          }}
        >
          {courses.map((c) => (
            <option key={c._id} value={String(c._id)}>
              {c.title}
            </option>
          ))}
        </Select>
      </FormControl>
      {courseId ? (
        <FormControl size="sm">
          <FormLabel fontSize="xs">Lesson (optional)</FormLabel>
          {loadingLessons ? (
            <Spinner size="xs" />
          ) : (
            <Select
              size="sm"
              placeholder="Whole course"
              value={lessonId}
              onChange={(e) => {
                const val = e.target.value;
                setLessonId(val);
                const lesson = lessons.find((l) => String(l._id) === val);
                applyScope(courseId, val, lesson);
              }}
            >
              {lessons.map((l) => (
                <option key={l._id} value={String(l._id)}>
                  {l.title}
                </option>
              ))}
            </Select>
          )}
        </FormControl>
      ) : null}
    </Box>
  );
}

export function MslAiScopeChip({ scope }) {
  if (!scope?.courseId && !scope?.lessonId && !scope?.s3Keys?.length) {
    return (
      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
        No scope — pick content below
      </span>
    );
  }
  return (
    <span className="text-xs text-msl-primary bg-msl-accent px-2 py-1 rounded-full">
      {scope.label || "Scoped content"}
      {scope.s3Keys?.length ? ` · ${scope.s3Keys.length} file(s)` : ""}
    </span>
  );
}
