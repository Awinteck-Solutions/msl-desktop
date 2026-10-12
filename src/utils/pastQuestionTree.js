export function flattenPastQuestionTree(tree) {
  const rows = [];
  for (const node of tree || []) {
    for (const yearNode of node.years || []) {
      for (const levelNode of yearNode.levels || []) {
        for (const paper of levelNode.papers || []) {
          rows.push({
            ...paper,
            categoryName: node.category?.name || "",
            categoryId: node.category?._id,
            year: yearNode.year ?? paper.year,
            level: levelNode.level ?? paper.level,
          });
        }
      }
    }
  }
  return rows;
}

export function groupPastQuestionSources(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = [row.categoryName, row.level, row.paperCode, row.title].join("|");
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title: row.title,
        level: row.level,
        paperCode: row.paperCode,
        categoryName: row.categoryName,
        papers: [],
      });
    }
    groups.get(key).papers.push(row);
  }
  return Array.from(groups.values()).map((group) => ({
    ...group,
    papers: group.papers.sort(
      (a, b) =>
        (b.year || 0) - (a.year || 0) ||
        String(a.sitting || "").localeCompare(String(b.sitting || ""))
    ),
  }));
}

/** Category → year → level → paper groups. */
export function groupRowsByYearLevelPaper(rows) {
  const categories = new Map();
  for (const row of rows || []) {
    const catKey = String(row.categoryName || row.categoryId || "Other");
    if (!categories.has(catKey)) {
      categories.set(catKey, {
        categoryName: row.categoryName || "Other",
        yearMap: new Map(),
      });
    }
    const cat = categories.get(catKey);
    const year = Number(row.year) || 0;
    if (!cat.yearMap.has(year)) cat.yearMap.set(year, new Map());
    const levelMap = cat.yearMap.get(year);
    const levelKey = String(row.level ?? "Other");
    if (!levelMap.has(levelKey)) levelMap.set(levelKey, []);
    levelMap.get(levelKey).push(row);
  }

  return Array.from(categories.values()).map((cat) => ({
    categoryName: cat.categoryName,
    years: Array.from(cat.yearMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, levelMap]) => ({
        year,
        levels: Array.from(levelMap.entries())
          .sort((a, b) =>
            String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true })
          )
          .map(([level, papers]) => ({
            level,
            groups: groupPastQuestionSources(papers),
          })),
      })),
  }));
}

export function groupTreeByYearLevelPaper(tree) {
  return groupRowsByYearLevelPaper(flattenPastQuestionTree(tree));
}

const defaultFilters = {
  query: "",
  category: "",
  year: "",
  level: "",
  paperCode: "",
};

function rowMatchesQuery(item, needle) {
  if (!needle) return true;
  return `${item.title} ${item.level} ${item.year} ${item.sitting} ${item.paperCode} ${item.categoryName}`
    .toLowerCase()
    .includes(needle);
}

/** Apply source filters to flat paper rows. */
export function filterPastQuestionRows(rows, filters = defaultFilters) {
  const f = { ...defaultFilters, ...filters };
  const needle = String(f.query || "").trim().toLowerCase();
  return (rows || []).filter((item) => {
    if (f.category && item.categoryName !== f.category) return false;
    if (f.year && Number(item.year) !== Number(f.year)) return false;
    if (f.level && String(item.level ?? "") !== String(f.level)) return false;
    if (f.paperCode && String(item.paperCode || "") !== String(f.paperCode)) return false;
    return rowMatchesQuery(item, needle);
  });
}

export function filterPastQuestionTree(tree, filters) {
  return groupRowsByYearLevelPaper(
    filterPastQuestionRows(flattenPastQuestionTree(tree), filters)
  );
}

/** Dropdown options; each list respects the other active filters. */
export function getCascadingFilterOptions(tree, filters = defaultFilters) {
  const all = flattenPastQuestionTree(tree);
  const pick = (omitKey) => {
    const partial = { ...defaultFilters, ...filters };
    if (omitKey === "category") partial.category = "";
    if (omitKey === "year") partial.year = "";
    if (omitKey === "level") partial.level = "";
    if (omitKey === "paperCode") partial.paperCode = "";
    return filterPastQuestionRows(all, partial);
  };

  const uniqSort = (values, numeric = false) => {
    const set = new Set(values.filter((v) => v !== "" && v != null));
    const arr = Array.from(set);
    if (numeric) return arr.sort((a, b) => Number(b) - Number(a));
    return arr.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  };

  return {
    categories: uniqSort(pick("category").map((r) => r.categoryName)),
    years: uniqSort(
      pick("year").map((r) => r.year),
      true
    ),
    levels: uniqSort(pick("level").map((r) => r.level)),
    paperCodes: uniqSort(pick("paperCode").map((r) => r.paperCode || "")),
  };
}

export function countFilteredPapers(sourceTree) {
  let n = 0;
  for (const cat of sourceTree || []) {
    for (const yearNode of cat.years || []) {
      for (const levelNode of yearNode.levels || []) {
        for (const group of levelNode.groups || []) {
          n += group.papers?.length || 0;
        }
      }
    }
  }
  return n;
}

/** @deprecated use filterPastQuestionTree */
export function filterTreeBySearch(tree, query) {
  return filterPastQuestionTree(tree, { query });
}

export function groupKeyForSource(categoryName, year, level, groupKey) {
  return `${categoryName}|${year}|${level}|${groupKey}`;
}

export function papersInSameCourse(flatRows, paper) {
  if (!paper) return [];
  const cat = String(paper.categoryId?._id || paper.categoryId || "");
  const level = String(paper.level ?? "");
  const code = String(paper.paperCode || "");
  const title = String(paper.title || "");
  return (flatRows || []).filter(
    (row) =>
      String(row.categoryId?._id || row.categoryId || "") === cat &&
      String(row.level ?? "") === level &&
      String(row.paperCode || "") === code &&
      String(row.title || "") === title
  );
}
