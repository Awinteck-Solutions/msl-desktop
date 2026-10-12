import {
  leafTopicLabel,
  mapLabelToSyllabus,
  matchSyllabusTopic,
  scoreSyllabusTopic,
} from "./syllabusTopics";

const STOP = new Set(
  "the a an of and to in for on with is are be by or as at from that this it its was were been being not no into over under about after before than then your you we they their our".split(
    " "
  )
);

export function tokens(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP.has(word));
}

export function similarity(left, right) {
  const a = new Set(tokens(left));
  const b = new Set(tokens(right));
  if (!a.size || !b.size) return 0;
  let shared = 0;
  a.forEach((word) => {
    if (b.has(word)) shared += 1;
  });
  return Math.round((2 * shared * 100) / (a.size + b.size));
}

function topicScore(topic, question) {
  const words = tokens(topic);
  if (!words.length) return 0;
  const haystack = new Set(tokens(question));
  const hits = words.filter((word) => haystack.has(word)).length;
  return hits / words.length;
}

function topicName(topic) {
  const raw = typeof topic === "string" ? topic : topic?.topic || topic?.label || "";
  return leafTopicLabel(raw);
}

export function groupQuestionsByTopic(questions, topics) {
  const catalog = (topics || []).map((topic) =>
    typeof topic === "string" ? { topic, label: topic } : { ...topic, topic: topicName(topic) }
  );
  const useSyllabus = catalog.some((topic) => topic.kind || topic.standards || topic.keywords);
  const groups = new Map(catalog.map((topic) => [topic.topic, []]));
  groups.set("Other", []);

  questions.forEach((question) => {
    let best = "Other";
    if (useSyllabus) {
      const matched = matchSyllabusTopic(question.question, catalog, 1.6);
      if (matched) best = matched.topic.topic || matched.topic.label;
    } else {
      let bestScore = 0.34;
      catalog.forEach((topic) => {
        const score = topicScore(topic.topic, question.question);
        if (score > bestScore) {
          best = topic.topic;
          bestScore = score;
        }
      });
    }
    if (!groups.has(best)) groups.set(best, []);
    groups.get(best).push(question);
  });

  return Array.from(groups.entries())
    .filter(([, items]) => items.length)
    .sort((a, b) => {
      if (a[0] === "Other") return 1;
      if (b[0] === "Other") return -1;
      return b[1].length - a[1].length;
    });
}

/**
 * Every question that matches a topic across sittings (not only best-match winners).
 * Prefer this when drilling into a frequency topic so all sittings appear.
 */
export function collectQuestionsForTopic(questions, topic, topics = [], minimum = 1.8) {
  const focus = topicName(topic);
  if (!focus) return [];
  const catalog = (topics || []).map((row) =>
    typeof row === "string" ? { topic: topicName(row), label: topicName(row) } : { ...row, topic: topicName(row) }
  );
  const target =
    catalog.find(
      (row) =>
        row.topic === focus ||
        leafTopicLabel(row.label) === focus ||
        leafTopicLabel(row.displayLabel) === focus
    ) || {
      topic: focus,
      label: focus,
    };
  const useSyllabus = Boolean(target.kind || target.standards || target.keywords || catalog.some((row) => row.kind));

  // Only include questions whose best syllabus match is this topic (or a strong direct score).
  const scored = (questions || [])
    .map((question) => {
      const direct = useSyllabus
        ? scoreSyllabusTopic(target, question.question)
        : topicScore(focus, question.question);
      const best = useSyllabus ? matchSyllabusTopic(question.question, catalog, 1.6) : null;
      const bestLabel = best ? topicName(best.topic) : "";
      const isBest =
        !useSyllabus ||
        bestLabel === focus ||
        leafTopicLabel(best?.topic?.label) === focus ||
        leafTopicLabel(best?.topic?.displayLabel) === focus;
      return { question, score: direct, isBest };
    })
    .filter((row) => row.score >= minimum && row.isBest)
    .sort((a, b) => b.score - a.score || Number(b.question.year || 0) - Number(a.question.year || 0));

  return scored.map((row) => row.question).sort(
    (a, b) =>
      Number(b.year || 0) - Number(a.year || 0) ||
      String(a.sitting || "").localeCompare(String(b.sitting || "")) ||
      Number(a.number || 0) - Number(b.number || 0)
  );
}

function comparisonPool(questions, max = 360) {
  if (questions.length <= max) return questions;
  const byPaper = new Map();
  questions.forEach((question) => {
    const key = question.paperId || "paper";
    const list = byPaper.get(key) || [];
    list.push(question);
    byPaper.set(key, list);
  });
  const perPaper = Math.max(8, Math.floor(max / byPaper.size));
  return Array.from(byPaper.values()).flatMap((list) => list.slice(0, perPaper));
}

function dice(left, right) {
  if (!left.size || !right.size) return 0;
  let shared = 0;
  left.forEach((word) => {
    if (right.has(word)) shared += 1;
  });
  return Math.round((2 * shared * 100) / (left.size + right.size));
}

export function similarLinks(questions, minimum = 46) {
  return buildSimilarPairs(questions, minimum).slice(0, 40);
}

function buildSimilarPairs(questions, minimum = 46) {
  const prepared = comparisonPool(questions).map((question) => ({
    question,
    words: new Set(tokens(question.question)),
  }));
  const links = [];
  for (let i = 0; i < prepared.length; i += 1) {
    for (let j = i + 1; j < prepared.length; j += 1) {
      const left = prepared[i].question;
      const right = prepared[j].question;
      if (left.paperId === right.paperId) continue;
      if (left.year === right.year && String(left.sitting) === String(right.sitting)) continue;
      const score = dice(prepared[i].words, prepared[j].words);
      if (score >= minimum) links.push({ score, left, right });
    }
  }
  return links.sort((a, b) => b.score - a.score);
}

/** Map questionId → similar peers [{ score, question }], sorted by score. */
export function similarPeersByQuestion(questions, minimum = 46, perQuestion = 8) {
  const links = buildSimilarPairs(questions, minimum);
  const map = new Map();
  const push = (id, score, peer) => {
    if (!id || !peer?._id) return;
    const list = map.get(id) || [];
    if (list.some((item) => item.question._id === peer._id)) return;
    list.push({ score, question: peer });
    map.set(id, list);
  };
  links.forEach(({ score, left, right }) => {
    push(left._id, score, right);
    push(right._id, score, left);
  });
  map.forEach((list, id) => {
    map.set(
      id,
      list
        .sort((a, b) => b.score - a.score || String(a.question.year).localeCompare(String(b.question.year)))
        .slice(0, perQuestion)
    );
  });
  return map;
}

export function sourceLabel(question) {
  return [question.sitting, question.year, question.paperCode && `Paper ${question.paperCode}`]
    .filter(Boolean)
    .join(" ");
}

function topicKey(value) {
  const raw = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const standard = raw.match(/\b(?:ifrs|ias|ipsas)\s*\d+[a-z]?\b/);
  if (standard) return standard[0].replace(/\s+/g, " ");
  return raw;
}

export function topicFrequencyFromGroups(topicGroups, catalog = []) {
  const metaByName = new Map((catalog || []).map((topic) => [topicName(topic), topic]));
  return (topicGroups || [])
    .filter(([topic]) => topic !== "Other")
    .map(([topic, items]) => {
      const sittingKeys = new Set();
      const years = new Set();
      const sittingLabels = new Set();
      const paperIds = new Set();
      items.forEach((item) => {
        const key = `${item.year}|${item.sitting || ""}|${item.paperId || ""}`;
        sittingKeys.add(key);
        if (item.year) years.add(Number(item.year));
        if (item.paperId) paperIds.add(String(item.paperId));
        const label = [item.sitting, item.year].filter(Boolean).join(" ");
        if (label) sittingLabels.add(label);
      });
      const meta = metaByName.get(topic);
      return {
        topic,
        questions: items.length,
        sittings: sittingKeys.size,
        years: Array.from(years).sort((a, b) => a - b),
        sittingLabels: Array.from(sittingLabels),
        paperIds: Array.from(paperIds),
        section: meta?.section || meta?.syllabusSection || "",
        kind: meta?.kind || "",
        weight: meta?.weight || meta?.syllabusWeight || 0,
      };
    })
    .sort((a, b) => b.sittings - a.sittings || b.questions - a.questions);
}

export function aggregateTopicFrequency(entries, sittingsTotal = 0, syllabusTopics = []) {
  const buckets = new Map();
  (entries || []).forEach(({ paper, insight }) => {
    if (!insight) return;
    const year = Number(paper?.year) || 0;
    const sittingLabel = [paper?.sitting, paper?.year].filter(Boolean).join(" ");
    const sittingKey = `${paper?.year}|${paper?.sitting || ""}|${paper?._id || ""}`;
    (insight.topics || []).forEach((row) => {
      const rawLabel = String(row?.topic || row || "").trim();
      if (!rawLabel) return;
      const mapped = syllabusTopics.length ? mapLabelToSyllabus(rawLabel, syllabusTopics) : null;
      const label = leafTopicLabel(mapped?.label || mapped?.topic || rawLabel);
      const key = mapped?.id || topicKey(label);
      const next = buckets.get(key) || {
        topic: label,
        questions: 0,
        years: new Set(),
        sittingKeys: new Set(),
        sittingLabels: new Set(),
        section: mapped?.section || "",
        kind: mapped?.kind || "",
        weight: mapped?.weight || 0,
      };
      if (label.length > next.topic.length) next.topic = label;
      next.questions += Math.max(1, Number(row?.count) || 1);
      if (year) next.years.add(year);
      (Array.isArray(row?.years) ? row.years : []).forEach((value) => {
        const parsed = Number(value);
        if (parsed) next.years.add(parsed);
      });
      next.sittingKeys.add(sittingKey);
      if (sittingLabel) next.sittingLabels.add(sittingLabel);
      buckets.set(key, next);
    });
  });

  return {
    sittings:
      sittingsTotal ||
      new Set((entries || []).map((item) => item.paper?._id).filter(Boolean)).size,
    topics: Array.from(buckets.values())
      .map((item) => ({
        topic: item.topic,
        questions: item.questions,
        sittings: item.sittingKeys.size,
        years: Array.from(item.years).sort((a, b) => a - b),
        sittingLabels: Array.from(item.sittingLabels),
        section: item.section,
        kind: item.kind,
        weight: item.weight,
      }))
      .sort((a, b) => b.sittings - a.sittings || b.questions - a.questions),
  };
}

export { scoreSyllabusTopic };
