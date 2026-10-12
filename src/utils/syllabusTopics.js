import syllabus from "../data/icagSyllabus.json";

const EXTRA_KEYWORDS = {
  "ratio analysis": ["roce", "gearing", "liquidity", "profitability", "solvency", "current ratio", "asset turnover"],
  "ratio calculation": ["roce", "gearing", "liquidity", "profitability", "current ratio"],
  "conceptual framework": ["qualitative", "faithful", "relevance", "materiality", "going concern"],
  "business combinations": ["goodwill", "subsidiary", "nci", "non-controlling", "acquisition"],
  "consolidated financial statements": ["consolidation", "group", "subsidiary", "parent", "intra-group"],
  "revenue from contracts with customers": ["ifrs 15", "performance obligation", "contract"],
  "property, plant and equipment": ["ppe", "depreciation", "revaluation", "ias 16"],
  "application of information technology in taxation": [
    "e-auditing",
    "e-audit",
    "e-vat",
    "e-invoicing",
    "data analytics",
    "digitalisation",
    "digitalization",
    "automation",
    "gra portal",
    "e-filing",
    "electronic tax",
  ],
};

const SITTING_RANK = [
  [/mar|april|apr/i, 1],
  [/may|june|jun|july|jul/i, 2],
  [/aug|sep|sept/i, 3],
  [/nov|dec/i, 4],
];

function sittingRank(sitting = "") {
  for (const [re, rank] of SITTING_RANK) {
    if (re.test(String(sitting || ""))) return rank;
  }
  return 2;
}

export function isTopicEffectiveForSitting(topic, year, sitting) {
  const from = topic?.effectiveFrom;
  if (!from?.year) return true;
  const y = Number(year);
  const fromY = Number(from.year);
  if (!Number.isFinite(y) || !Number.isFinite(fromY)) return true;
  if (y > fromY) return true;
  if (y < fromY) return false;
  return sittingRank(sitting) >= sittingRank(from.sitting || "November");
}

function sortedUnique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function withExtraKeywords(topic) {
  const label = String(topic.label || topic.topic || "").toLowerCase();
  const extras = [];
  Object.entries(EXTRA_KEYWORDS).forEach(([needle, words]) => {
    if (label.includes(needle)) extras.push(...words);
  });
  if (!extras.length) return topic;
  return {
    ...topic,
    keywords: sortedUnique([...(topic.keywords || []), ...extras]),
  };
}

/** Final segment + strip "(H) " syllabus letter prefixes. */
export function leafTopicLabel(label) {
  const text = String(label || "").trim();
  if (!text) return "";
  const parts = text.split(/\s*>\s*/);
  return (parts[parts.length - 1] || text).replace(/^\(([A-Za-z])\)\s*/, "").trim();
}

export function resolvePaperCode({ paperCode = "", title = "", level = "" } = {}) {
  const code = String(paperCode || "").trim();
  if (code && syllabus.resolve.byCode[code]) return code;
  const alias = String(title || "")
    .replace(/\s+Solutions?\s*$/i, "")
    .trim()
    .toUpperCase();
  if (alias && syllabus.resolve.byAlias[alias]) return syllabus.resolve.byAlias[alias];
  for (const paper of Object.values(syllabus.papers)) {
    if (alias.includes(paper.title.toUpperCase())) return paper.code;
    if (paper.aliases.some((name) => alias.includes(String(name).toUpperCase()))) return paper.code;
  }
  return "";
}

export function getSyllabusPaper(ref) {
  const code = typeof ref === "string" ? ref : resolvePaperCode(ref || {});
  return code ? syllabus.papers[code] || null : null;
}

function expandAliasTopics(topics) {
  const byId = new Map(topics.map((topic) => [topic.id, topic]));
  return topics
    .filter((topic) => !topic.aliasOf)
    .map((topic) => {
      const aliases = topics.filter((row) => row.aliasOf === topic.id);
      if (!aliases.length) return topic;
      return {
        ...topic,
        keywords: sortedUnique([
          ...(topic.keywords || []),
          ...aliases.flatMap((row) => row.keywords || []),
        ]),
        aliases: sortedUnique([
          ...(topic.aliases || []),
          ...aliases.map((row) => leafTopicLabel(row.label)),
          ...aliases.flatMap((row) => row.aliases || []),
        ]),
      };
    })
    .map((topic) => {
      // Keep canonical even if somehow only aliases exist
      if (byId.has(topic.id)) return topic;
      return topic;
    });
}

export function syllabusTopicsForPaper(ref = {}) {
  const paper = getSyllabusPaper(ref);
  if (!paper) return [];
  const year = ref.year;
  const sitting = ref.sitting;
  const expanded = expandAliasTopics(paper.topics || []);
  return expanded
    .filter((topic) => isTopicEffectiveForSitting(topic, year, sitting))
    .map((topic) => {
      const leaf = leafTopicLabel(topic.label);
      return withExtraKeywords({
        ...topic,
        label: leaf,
        topic: leaf,
        displayLabel: leaf,
        fullLabel: topic.label,
        paperCode: paper.code,
        family: paper.family,
        syllabusSection: topic.section,
        syllabusWeight: topic.weight,
      });
    });
}

/** Catalog for a course spanning many sittings: include topic if effective for any sitting. */
export function syllabusTopicsForCourse(ref = {}, sittings = []) {
  const paper = getSyllabusPaper(ref);
  if (!paper) return [];
  const rows = sittings?.length
    ? sittings
    : [{ year: ref.year, sitting: ref.sitting }];
  const expanded = expandAliasTopics(paper.topics || []);
  return expanded
    .filter((topic) => {
      if (!topic.effectiveFrom) return true;
      return rows.some((row) => isTopicEffectiveForSitting(topic, row.year, row.sitting));
    })
    .map((topic) => {
      const leaf = leafTopicLabel(topic.label);
      return withExtraKeywords({
        ...topic,
        label: leaf,
        topic: leaf,
        displayLabel: leaf,
        fullLabel: topic.label,
        paperCode: paper.code,
        family: paper.family,
        syllabusSection: topic.section,
        syllabusWeight: topic.weight,
      });
    });
}

function normalizeStd(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function textStds(text) {
  return (String(text || "").toLowerCase().match(/\b(?:ias|ifrs|ipsas)\s*\d+[a-z]?\b/g) || []).map(
    normalizeStd
  );
}

function formatSyllabusDisplay(topic) {
  if (!topic) return "";
  // Show the syllabus title only — not section letters like "(D)".
  return leafTopicLabel(topic.label || topic.topic || topic.displayLabel || "");
}

function bareStandardTitle(label) {
  return leafTopicLabel(label)
    .replace(/^(?:ias|ifrs|ipsas)\s*\d+[a-z]?\s*/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(and|of|the|for|with)\b/g, " ")
    .replace(/\s+/g, " ")
    .replace(/s\b/g, "")
    .trim();
}

/** Prefer full syllabus title for bare "IFRS 10" / "Income tax". */
export function expandStandardLabel(label, topics = []) {
  const leaf = leafTopicLabel(label);
  const catalog = topics || [];
  const lower = leaf.toLowerCase();

  const aliasHit = catalog.find((topic) => {
    const names = [topic.label, topic.topic, topic.displayLabel, ...(topic.aliases || [])]
      .filter(Boolean)
      .map((item) => leafTopicLabel(item).toLowerCase());
    return names.includes(lower);
  });
  if (aliasHit) return formatSyllabusDisplay(aliasHit) || leafTopicLabel(aliasHit.label || aliasHit.topic);

  const stdMatch = leaf.match(/\b((?:ias|ifrs|ipsas)\s*\d+[a-z]?)\b/i);
  const std = stdMatch ? normalizeStd(stdMatch[1]) : "";
  if (std) {
    const prettyStd = std.replace(/^(ias|ifrs|ipsas)\s+/i, (m) => m.toUpperCase().replace(/\s+/, " "));
    const hit = catalog.find((topic) => (topic.standards || []).map(normalizeStd).includes(std));
    if (hit) return formatSyllabusDisplay(hit) || leafTopicLabel(hit.label || hit.topic);

    const byLabel = catalog.find((topic) =>
      leafTopicLabel(topic.label || topic.topic).toLowerCase().startsWith(std)
    );
    if (byLabel) return formatSyllabusDisplay(byLabel) || leafTopicLabel(byLabel.label || byLabel.topic);

    const fromDict = syllabus.standardTitles?.[prettyStd] || syllabus.standardTitles?.[std.toUpperCase()];
    if (fromDict) return fromDict;
    return leaf;
  }

  // Title without short label, e.g. "Income tax" → "IAS 12 Income Taxes"
  const lowerBare = bareStandardTitle(leaf);
  const byBareTitle = catalog.find((topic) => {
    if (!(topic.standards || []).length && topic.kind !== "standard") return false;
    const bare = bareStandardTitle(topic.label || topic.topic);
    return Boolean(bare) && bare === lowerBare;
  });
  if (byBareTitle) return formatSyllabusDisplay(byBareTitle) || leafTopicLabel(byBareTitle.label || byBareTitle.topic);

  const fromDictBare = Object.entries(syllabus.standardTitles || {}).find(([, title]) => {
    return bareStandardTitle(title) === lowerBare;
  });
  if (fromDictBare) return fromDictBare[1];

  return leaf;
}

/** Display helper: expand codes/bare titles; never show syllabus section letters. */
export function displayTopicLabel(label, topics = []) {
  return leafTopicLabel(expandStandardLabel(label, topics));
}

const WEAK_SCORE_TOKENS = new Set([
  "tax",
  "taxes",
  "taxation",
  "income",
  "ghana",
  "ghanaian",
  "system",
  "policy",
  "issues",
  "practice",
  "application",
  "information",
  "technology",
  "liabilities",
  "administration",
  "financial",
  "reporting",
  "ias",
  "ifrs",
  "ipsas",
  "and",
  "the",
  "for",
  "with",
]);

function phraseHits(hay, phrases = []) {
  return (phrases || [])
    .map((item) => String(item || "").toLowerCase().trim())
    .filter((phrase) => {
      if (phrase.length < 4) return false;
      if (phrase.includes(" ")) return hay.includes(phrase);
      return phrase.length >= 6 && !WEAK_SCORE_TOKENS.has(phrase) && hay.includes(phrase);
    });
}

export function scoreSyllabusTopic(topic, questionText) {
  const hay = String(questionText || "").toLowerCase();
  if (!hay.trim()) return 0;

  const negatives = phraseHits(hay, topic.negativeKeywords || []);
  // Any negative hit disqualifies the topic — prevents e.g. consolidation Qs matching "single entity".
  if (negatives.length) return 0;

  let score = 0;
  const stds = (topic.standards || []).map(normalizeStd).filter(Boolean);
  const found = textStds(hay);
  stds.forEach((std) => {
    if (found.includes(std) || hay.includes(std)) score += 4.5;
  });
  found.forEach((std) => {
    if ((topic.label || "").toLowerCase().includes(std)) score += 1.25;
  });

  const keywordHits = phraseHits(hay, topic.keywords || []);
  if (keywordHits.length) {
    score += Math.min(4.5, keywordHits.length * 1.35);
    // Prefer distinctive multi-word hits
    keywordHits.forEach((hit) => {
      if (hit.includes(" ")) score += 0.55;
    });
  }

  const aliasHits = phraseHits(hay, topic.aliases || []);
  aliasHits.forEach((alias) => {
    score += alias.includes(" ") || alias.length > 12 ? 2.6 : 1.2;
  });

  const label = String(topic.label || "").toLowerCase();
  const compact = label.replace(/^\([a-z]\)\s*/, "");
  if (compact.length > 12 && compact.length < 80 && hay.includes(compact)) score += 2.4;

  // No free points for kind — that previously made every question match every section.
  if (topic.kind === "syllabus_competency") score -= 0.35;

  return Math.max(0, score);
}

export function matchSyllabusTopic(questionText, topics, minimum = 1.6) {
  let best = null;
  let bestScore = minimum;
  let second = 0;
  (topics || []).forEach((topic) => {
    const score = scoreSyllabusTopic(topic, questionText);
    if (score > bestScore) {
      second = bestScore;
      best = topic;
      bestScore = score;
    } else if (score > second) {
      second = score;
    }
  });
  // Require a clear winner for section-style catalogs
  if (best && bestScore - second < 0.45 && bestScore < 3.2) return null;
  return best ? { topic: best, score: bestScore } : null;
}

export function mapLabelToSyllabus(label, topics) {
  const text = String(label || "");
  const expanded = expandStandardLabel(text, topics);
  // alias exact match
  const aliasHit = (topics || []).find((topic) => {
    const names = [topic.label, topic.topic, topic.displayLabel, ...(topic.aliases || [])].map((item) =>
      leafTopicLabel(item).toLowerCase()
    );
    return (
      names.includes(leafTopicLabel(text).toLowerCase()) ||
      names.includes(leafTopicLabel(expanded).toLowerCase())
    );
  });
  if (aliasHit) return aliasHit;

  const byStd = (() => {
    const std = normalizeStd((expanded.match(/\b(?:ias|ifrs|ipsas)\s*\d+[a-z]?\b/i) || [])[0] || "");
    if (!std) return null;
    return (
      (topics || []).find((topic) => (topic.standards || []).map(normalizeStd).includes(std)) || null
    );
  })();
  if (byStd) return byStd;

  const byBare = (topics || []).find((topic) => {
    if (!(topic.standards || []).length && topic.kind !== "standard") return false;
    const bare = bareStandardTitle(topic.label || topic.topic);
    const lower = leafTopicLabel(text).toLowerCase();
    return bare === lower || bare.replace(/es$/, "e") === lower.replace(/es$/, "e");
  });
  if (byBare) return byBare;

  const direct = matchSyllabusTopic(expanded, topics, 0.45);
  return direct ? direct.topic : null;
}

export function remapFrequencyToSyllabus(frequency, syllabusTopics = []) {
  if (!frequency?.topics?.length) return frequency || { sittings: 0, topics: [] };
  const catalog = syllabusTopics.length ? syllabusTopics : [];
  const buckets = new Map();
  frequency.topics.forEach((row) => {
    const mapped = catalog.length ? mapLabelToSyllabus(row.topic, catalog) : null;
    const label = mapped
      ? formatSyllabusDisplay(mapped) || leafTopicLabel(mapped.label || mapped.topic)
      : expandStandardLabel(row.topic, catalog);
    const key = mapped?.id || topicKey(label);
    const next = buckets.get(key) || {
      topic: label,
      questions: 0,
      sittings: 0,
      years: new Set(),
      sittingLabels: new Set(),
      paperIds: new Set(),
      section: mapped?.section || row.section || "",
      kind: mapped?.kind || row.kind || "",
      weight: mapped?.weight || row.weight || 0,
    };
    if (label.length >= next.topic.length) next.topic = label;
    next.questions += Number(row.questions || row.count || 0) || 0;
    next.sittings = Math.max(next.sittings, Number(row.sittings || 0) || 0);
    (row.years || []).forEach((year) => next.years.add(Number(year)));
    (row.sittingLabels || []).forEach((labelText) => next.sittingLabels.add(labelText));
    (row.paperIds || []).forEach((id) => {
      if (id) next.paperIds.add(String(id));
    });
    buckets.set(key, next);
  });
  return {
    sittings: frequency.sittings || 0,
    topics: Array.from(buckets.values())
      .map((item) => ({
        topic: displayTopicLabel(item.topic, catalog),
        questions: item.questions,
        sittings: Math.max(item.sittings, item.paperIds.size),
        years: Array.from(item.years).filter(Boolean).sort((a, b) => a - b),
        sittingLabels: Array.from(item.sittingLabels),
        paperIds: Array.from(item.paperIds),
        section: item.section,
        kind: item.kind,
        weight: item.weight,
      }))
      .sort((a, b) => b.sittings - a.sittings || b.questions - a.questions),
  };
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

export function syllabusEdition() {
  return syllabus.edition;
}

export function syllabusSource() {
  return syllabus.source;
}
