import { fetchPastQuestionPaper } from "../Services/PastQuestionApi";
import { flattenPastQuestionTree, papersInSameCourse } from "./pastQuestionTree";
import { idOf } from "./id";

export function withQuestionSource(paper) {
  return (paper?.questions || []).map((question) => ({
    ...question,
    paperId: paper._id,
    title: paper.title,
    year: paper.year,
    sitting: paper.sitting,
    level: paper.level,
    paperCode: paper.paperCode,
  }));
}

export async function fetchCourseQuestions(paper, tree) {
  if (!paper?._id) return [];
  const flat = flattenPastQuestionTree(tree);
  const related = papersInSameCourse(flat, paper);
  const ids = [...new Set([String(paper._id), ...related.map((r) => String(r._id))])];
  const papers = await Promise.all(
    ids.map(async (id) => {
      if (String(id) === String(paper._id)) return paper;
      const res = await fetchPastQuestionPaper(id);
      return res.ok ? res.paper : null;
    })
  );
  return papers.filter(Boolean).flatMap(withQuestionSource);
}

export function courseMatchKey(paper) {
  return [
    idOf(paper?.categoryId),
    paper?.level,
    paper?.paperCode,
    paper?.title,
  ].join("|");
}
