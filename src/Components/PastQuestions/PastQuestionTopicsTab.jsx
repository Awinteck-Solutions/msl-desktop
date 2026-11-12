import { useEffect, useMemo, useRef, useState } from "react";
import PastQuestionExamText from "./PastQuestionExamText";
import { LocateFixed, Sparkles } from "lucide-react";
import PastQuestionQuestionFilters from "./PastQuestionQuestionFilters";
import PastQuestionTopicFrequency from "./PastQuestionTopicFrequency";
import { plainTextFromHtml } from "../../utils/aiHtmlContent";
import {
  collectQuestionsForTopic,
  groupQuestionsByTopic,
  sourceLabel,
  topicFrequencyFromGroups,
} from "../../utils/pastQuestionGroups";
import {
  displayTopicLabel,
  getSyllabusPaper,
  isTopicEffectiveForSitting,
  leafTopicLabel,
  remapFrequencyToSyllabus,
  syllabusSource,
  syllabusTopicsForCourse,
} from "../../utils/syllabusTopics";

export default function PastQuestionTopicsTab({
  paper,
  courseQuestions,
  topicFrequency,
  compareBusy,
  focusTopic,
  onFocusTopic,
  onAskAbout,
  onOpenSitting,
}) {
  const questionsAnchorRef = useRef(null);
  const [topicQuestionQuery, setTopicQuestionQuery] = useState("");

  useEffect(() => {
    if (!focusTopic) return undefined;
    const timer = window.setTimeout(() => {
      questionsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [focusTopic]);

  useEffect(() => {
    setTopicQuestionQuery("");
  }, [focusTopic]);

  const sittings = useMemo(
    () =>
      Array.from(
        new Map(
          courseQuestions.map((item) => [
            `${item.year}|${item.sitting || ""}`,
            { year: item.year, sitting: item.sitting },
          ])
        ).values()
      ),
    [courseQuestions]
  );

  const syllabusTopics = useMemo(
    () =>
      syllabusTopicsForCourse(
        {
          paperCode: paper?.paperCode,
          title: paper?.title,
          level: paper?.level,
          year: paper?.year,
          sitting: paper?.sitting,
        },
        sittings
      ),
    [paper, sittings]
  );

  const syllabusPaper = useMemo(
    () =>
      getSyllabusPaper({
        paperCode: paper?.paperCode,
        title: paper?.title,
        level: paper?.level,
      }),
    [paper]
  );

  const topicNames = useMemo(() => {
    if (syllabusTopics.length) {
      const preferred = syllabusTopics.filter(
        (topic) => topic.kind === "syllabus_section" || topic.kind === "standard"
      );
      return preferred.length ? preferred : syllabusTopics;
    }
    if (topicFrequency?.topics?.length) return topicFrequency.topics;
    return [];
  }, [syllabusTopics, topicFrequency]);

  const topicGroups = useMemo(() => {
    const groups = groupQuestionsByTopic(courseQuestions, topicNames);
    return groups
      .map(([topic, items]) => {
        const meta = syllabusTopics.find(
          (row) =>
            leafTopicLabel(row.topic) === leafTopicLabel(topic) ||
            leafTopicLabel(row.label) === leafTopicLabel(topic)
        );
        if (!meta?.effectiveFrom) return [topic, items];
        return [
          topic,
          items.filter((item) =>
            isTopicEffectiveForSitting(meta, item.year, item.sitting)
          ),
        ];
      })
      .filter(([, items]) => items.length);
  }, [courseQuestions, topicNames, syllabusTopics]);

  const frequency = useMemo(() => {
    const fromGroups = topicFrequencyFromGroups(topicGroups, syllabusTopics);
    const sittingCount = new Set(
      courseQuestions.map((item) => item.paperId).filter(Boolean)
    ).size;
    if (!topicFrequency?.topics?.length) {
      return { sittings: sittingCount, topics: fromGroups };
    }
    return remapFrequencyToSyllabus(
      {
        sittings: topicFrequency.sittings || sittingCount,
        topics: [...topicFrequency.topics, ...fromGroups],
      },
      syllabusTopics
    );
  }, [topicFrequency, topicGroups, courseQuestions, syllabusTopics]);

  const visibleTopicGroups = useMemo(() => {
    if (!focusTopic) return topicGroups;
    const focus = leafTopicLabel(focusTopic);
    const meta = frequency.topics?.find((row) => leafTopicLabel(row.topic) === focus);
    const topicMeta = syllabusTopics.find(
      (row) =>
        leafTopicLabel(row.topic) === focus || leafTopicLabel(row.label) === focus
    );
    const poolBase = meta?.paperIds?.length
      ? courseQuestions.filter((item) =>
          meta.paperIds.map(String).includes(String(item.paperId))
        )
      : courseQuestions;
    const pool = poolBase.filter((item) =>
      topicMeta ? isTopicEffectiveForSitting(topicMeta, item.year, item.sitting) : true
    );
    const focused = collectQuestionsForTopic(
      pool.length ? pool : courseQuestions,
      focus,
      syllabusTopics,
      1.8
    ).filter((item) =>
      topicMeta ? isTopicEffectiveForSitting(topicMeta, item.year, item.sitting) : true
    );
    return focused.length ? [[focus, focused]] : [];
  }, [topicGroups, focusTopic, courseQuestions, syllabusTopics, frequency]);

  const visibleQuestionCount = useMemo(
    () => visibleTopicGroups.reduce((sum, [, items]) => sum + items.length, 0),
    [visibleTopicGroups]
  );

  const filterTopicItems = (items) => {
    const needle = topicQuestionQuery.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => {
      const num = String(item.number ?? "");
      const plain = plainTextFromHtml(item.question || "").toLowerCase();
      return num.toLowerCase().includes(needle) || plain.includes(needle);
    });
  };

  const frequencySubtitle = syllabusPaper
    ? `ICAG ${syllabusPaper.code} ${syllabusPaper.title} · syllabus ${
        syllabusSource().syllabus ? "2024–2029" : ""
      }`
    : "Mapped to ICAG syllabus topics";

  return (
    <div className="px-5 py-4 space-y-5 max-w-3xl">
      <PastQuestionTopicFrequency
        frequency={frequency}
        title="Syllabus topic frequency across sittings"
        limit={16}
        syllabusTopics={syllabusTopics}
        subtitle={frequencySubtitle}
        onSelect={(topic) => onFocusTopic(topic)}
      />

      {(focusTopic || visibleTopicGroups.length > 0) && !compareBusy ? (
        <PastQuestionQuestionFilters
          value={topicQuestionQuery}
          onChange={setTopicQuestionQuery}
          total={visibleQuestionCount}
          shown={visibleTopicGroups.reduce(
            (sum, [, items]) => sum + filterTopicItems(items).length,
            0
          )}
          placeholder="Filter questions in topic view…"
        />
      ) : null}

      {focusTopic ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand/25 bg-brand/5 px-4 py-2.5">
          <span className="text-sm text-msl-text">
            Showing{" "}
            <strong>{displayTopicLabel(focusTopic, syllabusTopics)}</strong>
          </span>
          <button
            type="button"
            onClick={() => onFocusTopic("")}
            className="text-xs font-semibold text-brand hover:underline"
          >
            Show all topics
          </button>
        </div>
      ) : null}

      <div ref={questionsAnchorRef} id="pq-topic-questions" className="scroll-mt-6 h-0" aria-hidden />

      {visibleTopicGroups.map(([topic, items]) => {
        const filteredItems = filterTopicItems(items);
        if (topicQuestionQuery.trim() && !filteredItems.length) return null;
        const displayTopic = displayTopicLabel(topic, syllabusTopics);
        const meta = frequency.topics?.find(
          (row) =>
            displayTopicLabel(row.topic, syllabusTopics) === displayTopic ||
            leafTopicLabel(row.topic) === leafTopicLabel(topic)
        );
        const syllabusMeta = syllabusTopics.find(
          (row) =>
            displayTopicLabel(row.topic || row.label, syllabusTopics) === displayTopic ||
            row.topic === topic
        );
        const itemSittings = new Set(
          items.map((item) => `${item.year}|${item.sitting || ""}|${item.paperId || ""}`)
        ).size;
        const sittingCount = Math.max(itemSittings, meta?.sittings || 0);
        const sittingLabels = Array.from(
          new Set([
            ...(meta?.sittingLabels || []),
            ...items
              .map((item) => [item.sitting, item.year].filter(Boolean).join(" "))
              .filter(Boolean),
          ])
        );

        return (
          <section
            key={topic}
            className="rounded-xl border border-msl-border bg-msl-surface p-4 space-y-3"
          >
            <h3 className="text-base font-semibold text-msl-text">
              {displayTopic}{" "}
              <span className="text-xs font-normal text-msl-muted">
                {filteredItems.length} q
                {sittingCount ? ` · ${sittingCount} sittings` : ""}
                {syllabusMeta?.section ? ` · §${syllabusMeta.section}` : ""}
                {syllabusMeta?.weight ? ` · ${syllabusMeta.weight}%` : ""}
              </span>
            </h3>
            {syllabusMeta?.kind === "standard" ? (
              <p className="text-xs text-msl-muted">
                ICAG syllabus standard / examinable area
              </p>
            ) : null}
            {sittingLabels.length ? (
              <p className="text-xs text-msl-muted">Seen in {sittingLabels.join(" · ")}</p>
            ) : null}
            {filteredItems.map((item) => (
              <article
                key={`${item.paperId}-${item._id}`}
                className="rounded-lg border border-msl-border bg-msl-bg/30 p-3"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-msl-text flex-1 min-w-0">
                    {sourceLabel(item)} · Q{item.number || ""}
                  </span>
                  <button
                    type="button"
                    title="Go to question"
                    aria-label="Go to question"
                    onClick={() => onOpenSitting(item)}
                    className="p-1.5 rounded-lg text-msl-muted hover:text-brand hover:bg-brand/5"
                  >
                    <LocateFixed className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Ask AI"
                    aria-label="Ask AI"
                    onClick={() => onAskAbout(item)}
                    className="p-1.5 rounded-lg text-msl-muted hover:text-brand hover:bg-brand/5"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
                <PastQuestionExamText text={item.question} html={item.questionHtml} />
              </article>
            ))}
          </section>
        );
      })}

      {!visibleTopicGroups.length ? (
        <p className="text-sm text-msl-muted">
          {compareBusy
            ? "Comparing questions across sittings…"
            : focusTopic
              ? "No questions matched this topic."
              : "No topic groups yet."}
        </p>
      ) : null}
    </div>
  );
}
