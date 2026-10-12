import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Spinner, useToast } from "@chakra-ui/react";
import {
  BarChart3,
  ChevronLeft,
  FileText,
  Lightbulb,
  Link2,
  ListOrdered,
  Sparkles,
} from "lucide-react";
import AppShell from "../Components/Layout/AppShell";
import AiHtmlContent from "../Components/MslAi/AiHtmlContent";
import PastQuestionChatFab from "../Components/PastQuestions/PastQuestionChatFab";
import PastQuestionChatModal from "../Components/PastQuestions/PastQuestionChatModal";
import PastQuestionPdfViewer from "../Components/PastQuestions/PastQuestionPdfViewer";
import PastQuestionTopicsTab from "../Components/PastQuestions/PastQuestionTopicsTab";
import PastQuestionSimilarTab from "../Components/PastQuestions/PastQuestionSimilarTab";
import { PastQuestionSimilarPeers } from "../Components/PastQuestions/PastQuestionSimilarPeers";
import {
  similarLinks,
  similarPeersByQuestion,
} from "../utils/pastQuestionGroups";
import PastQuestionSourceFilters from "../Components/PastQuestions/PastQuestionSourceFilters";
import PastQuestionQuestionFilters from "../Components/PastQuestions/PastQuestionQuestionFilters";
import { fetchCourseQuestions, withQuestionSource } from "../utils/pastQuestionCourse";
import { getStoredUser } from "../Services/session";
import { mediaUrl } from "../Services/apiConfig";
import {
  fetchPastQuestionPaper,
  fetchPastQuestionPaperInsights,
  fetchPastQuestionTree,
  pastQuestionChat,
} from "../Services/PastQuestionApi";
import {
  countFilteredPapers,
  filterPastQuestionTree,
  flattenPastQuestionTree,
  getCascadingFilterOptions,
  groupKeyForSource,
} from "../utils/pastQuestionTree";
import { plainTextFromHtml } from "../utils/aiHtmlContent";
import { idOf } from "../utils/id";

function scrollToQuestionElement(questionId) {
  if (!questionId) return;
  window.setTimeout(() => {
    document
      .getElementById(`pq-q-${questionId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 150);
}

export default function PastQuestions() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [treeLoading, setTreeLoading] = useState(true);
  const [tree, setTree] = useState([]);
  const [accessError, setAccessError] = useState("");
  const [sourceFilters, setSourceFilters] = useState({
    query: "",
    category: "",
    year: "",
    level: "",
    paperCode: "",
  });
  const [openGroup, setOpenGroup] = useState("");
  const [questionQuery, setQuestionQuery] = useState("");

  const [paperLoading, setPaperLoading] = useState(false);
  const [paper, setPaper] = useState(null);
  const [insights, setInsights] = useState(null);
  const [readerView, setReaderView] = useState("questions");
  const [chatOpen, setChatOpen] = useState(false);
  const [highlightId, setHighlightId] = useState("");
  const [focusTopic, setFocusTopic] = useState("");
  const [courseQuestions, setCourseQuestions] = useState([]);
  const [compareBusy, setCompareBusy] = useState(false);
  const pendingChatAskRef = useRef(null);
  const pendingScrollRef = useRef(null);

  const [scope, setScope] = useState("paper");
  const [questionId, setQuestionId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [messages, setMessages] = useState([]);

  const filterOptions = useMemo(
    () => getCascadingFilterOptions(tree, sourceFilters),
    [tree, sourceFilters]
  );

  const sourceTree = useMemo(
    () => filterPastQuestionTree(tree, sourceFilters),
    [tree, sourceFilters]
  );

  const filteredSittingCount = useMemo(
    () => countFilteredPapers(sourceTree),
    [sourceTree]
  );

  const topicFrequency = insights?.topicFrequency || { sittings: 0, topics: [] };

  const peersByQuestion = useMemo(
    () => similarPeersByQuestion(courseQuestions),
    [courseQuestions]
  );

  const similarPairs = useMemo(
    () => similarLinks(courseQuestions),
    [courseQuestions]
  );

  const finishAskAbout = useCallback((item) => {
    if (!item?._id) return;
    setScope("question");
    setQuestionId(item._id);
    setChatOpen(true);
    setHighlightId(item._id);
    setReaderView("questions");
    scrollToQuestionElement(item._id);
  }, []);

  const resolveChatQuestion = useCallback(
    (qid) =>
      courseQuestions.find((q) => q._id === qid) ||
      (paper?.questions || []).find((q) => q._id === qid),
    [courseQuestions, paper]
  );

  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    setAccessError("");
    const result = await fetchPastQuestionTree();
    if (result.ok) {
      setTree(result.tree);
    } else {
      setTree([]);
      setAccessError(result.message);
    }
    setTreeLoading(false);
  }, []);

  const loadPaper = useCallback(
    async (id, summary) => {
      if (!id) return;
      setPaperLoading(true);
      setPaper(null);
      setInsights(null);
      setMessages([]);
      setQuestionId("");
      setScope("paper");
      setReaderView("questions");
      setHighlightId("");
      setFocusTopic("");
      setCourseQuestions([]);
      setQuestionQuery("");
      const pendingAsk = pendingChatAskRef.current;
      if (!pendingAsk || String(pendingAsk.paperId) !== String(id)) {
        pendingChatAskRef.current = null;
      }
      const pendingScroll = pendingScrollRef.current;
      if (!pendingScroll || String(pendingScroll.paperId) !== String(id)) {
        pendingScrollRef.current = null;
      }

      if (summary) {
        setOpenGroup(
          groupKeyForSource(
            summary.categoryName,
            summary.year,
            summary.level,
            [summary.categoryName, summary.level, summary.paperCode, summary.title].join("|")
          )
        );
      }

      const [paperRes, insightRes] = await Promise.all([
        fetchPastQuestionPaper(id),
        fetchPastQuestionPaperInsights(id),
      ]);

      if (paperRes.ok) {
        setPaper(paperRes.paper);
        setCourseQuestions(withQuestionSource(paperRes.paper));
      } else {
        toast({ title: paperRes.message, status: "error", duration: 5000 });
        if (paperRes.forbidden) navigate("/past-questions", { replace: true });
      }
      if (insightRes.ok) setInsights(insightRes.insights);
      setPaperLoading(false);
    },
    [navigate, toast]
  );

  useEffect(() => {
    if (!paper?._id || !tree.length) return undefined;
    let cancelled = false;
    setCompareBusy(true);
    fetchCourseQuestions(paper, tree)
      .then((rows) => {
        if (!cancelled) setCourseQuestions(rows);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCompareBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paper?._id, tree, paper]);

  useEffect(() => {
    if (!getStoredUser()?.token) {
      navigate("/login");
      return;
    }
    loadTree();
  }, [loadTree, navigate]);

  useEffect(() => {
    if (paperId) {
      const summary = flattenPastQuestionTree(tree).find((r) => r._id === paperId);
      loadPaper(paperId, summary);
    } else {
      setPaper(null);
      setInsights(null);
      setMessages([]);
      setQuestionId("");
    }
  }, [paperId, loadPaper, tree]);

  useEffect(() => {
    const pending = pendingChatAskRef.current;
    if (!pending || !paper?._id || paperLoading) return;
    if (String(paper._id) !== String(pending.paperId)) return;
    const onPaper = (paper.questions || []).find((q) => q._id === pending.questionId);
    if (onPaper) {
      pendingChatAskRef.current = null;
      finishAskAbout(onPaper);
      return;
    }
    const fromCourse = courseQuestions.find((q) => q._id === pending.questionId);
    if (fromCourse && String(fromCourse.paperId) === String(paper._id)) {
      pendingChatAskRef.current = null;
      finishAskAbout(fromCourse);
    }
  }, [paper, paperLoading, courseQuestions, finishAskAbout]);

  useEffect(() => {
    const pending = pendingScrollRef.current;
    if (!pending || !paper?._id || paperLoading) return;
    if (String(paper._id) !== String(pending.paperId)) return;
    const onPaper = (paper.questions || []).find((q) => q._id === pending.questionId);
    if (!onPaper) return;
    pendingScrollRef.current = null;
    setReaderView("questions");
    setHighlightId(onPaper._id);
    scrollToQuestionElement(onPaper._id);
  }, [paper, paperLoading]);

  useEffect(() => {
    if (!highlightId) return undefined;
    const timer = window.setTimeout(() => setHighlightId(""), 2600);
    return () => window.clearTimeout(timer);
  }, [highlightId]);

  const openPaper = (summary) => {
    navigate(`/past-questions/paper/${summary._id}`);
  };

  const openChat = () => {
    if (!paper) {
      toast({
        title: "Open a sitting first",
        description: "Select a paper from the sources list to chat with MSL AI.",
        status: "info",
        duration: 4000,
      });
      return;
    }
    setChatOpen(true);
  };

  const askAbout = (item) => {
    if (!item?._id) return;
    const targetPaperId = String(item.paperId || paper?._id || "");
    if (paper && targetPaperId && targetPaperId !== String(paper._id)) {
      pendingChatAskRef.current = {
        questionId: item._id,
        paperId: targetPaperId,
      };
      const summary = flattenPastQuestionTree(tree).find(
        (r) => String(r._id) === targetPaperId
      );
      if (summary) openPaper(summary);
      return;
    }
    finishAskAbout(item);
  };

  const openSitting = (question) => {
    if (!question?._id) return;
    if (!question.paperId || String(question.paperId) === String(paper?._id)) {
      setReaderView("questions");
      setHighlightId(question._id);
      scrollToQuestionElement(question._id);
      return;
    }
    pendingScrollRef.current = {
      questionId: question._id,
      paperId: question.paperId,
    };
    const summary = flattenPastQuestionTree(tree).find(
      (item) => item._id === question.paperId
    );
    if (summary) openPaper(summary);
  };

  const sendChat = async (overrideText) => {
    const question = (overrideText ?? chatInput).trim();
    if (!question || !paper?._id || chatBusy) return null;

    if (scope === "question" && !questionId) {
      toast({
        title: "Choose a question for question-scoped chat",
        status: "warning",
        duration: 3500,
      });
      return null;
    }

    setChatBusy(true);

    const history = messages
      .map((item) =>
        item.role === "user"
          ? { role: "user", text: item.text }
          : { role: "model", text: item.html || item.text || "" }
      )
      .filter((item) => item.text);

    const body = { question, scope, history };
    if (scope === "question") {
      const cq = resolveChatQuestion(questionId);
      body.questionId = questionId;
      body.paperId = cq?.paperId || paper._id;
    } else if (scope === "course") {
      body.categoryId = idOf(paper.categoryId);
      body.level = paper.level;
      body.paperCode = paper.paperCode || "";
      body.paperId = paper._id;
    } else {
      body.paperId = paper._id;
    }

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    if (!overrideText) setChatInput("");

    const result = await pastQuestionChat(body);
    setChatBusy(false);

    if (!result.ok) {
      toast({ title: result.message, status: "error", duration: 5000 });
      setMessages((prev) => prev.slice(0, -1));
      return null;
    }

    const answer = result.data?.answer || "";
    setMessages((prev) => [...prev, { role: "ai", html: answer }]);
    return answer;
  };

  const pdfUrl = paper?.fileUrl || (paper?.fileKey ? mediaUrl(paper.fileKey) : "");
  const topicRows = topicFrequency?.topics || [];

  const chatModal = (
    <>
      <PastQuestionChatFab onClick={openChat} disabled={Boolean(paperId && paperLoading)} />
      <PastQuestionChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        paper={paper}
        scope={scope}
        onScopeChange={(v) => {
          setScope(v);
          if (v !== "question") setQuestionId("");
        }}
        questionId={questionId}
        onQuestionIdChange={setQuestionId}
        messages={messages}
        input={chatInput}
        onInputChange={setChatInput}
        onSend={(text) => sendChat(text)}
        busy={chatBusy}
        onClearQuestionContext={() => {
          setQuestionId("");
          setScope("paper");
        }}
        contextQuestions={courseQuestions}
      />
    </>
  );

  if (paperId) {
    return (
      <AppShell
        active={{ pastQuestions: true }}
        noPadding
        headerRight={
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<ChevronLeft className="h-4 w-4" />}
            onClick={() => navigate("/past-questions")}
          >
            All sources
          </Button>
        }
      >
        <div className="flex h-[calc(100vh-73px)] min-h-0 overflow-hidden">
          <SourcesPane
            sourceFilters={sourceFilters}
            onSourceFiltersChange={setSourceFilters}
            filterOptions={filterOptions}
            resultCount={filteredSittingCount}
            sourceTree={sourceTree}
            openGroup={openGroup}
            onToggleGroup={(key) => setOpenGroup((p) => (p === key ? "" : key))}
            activePaperId={paperId}
            onOpenPaper={openPaper}
            loading={treeLoading}
          />

          <main className="flex-1 min-w-0 flex flex-col bg-msl-bg/30 overflow-hidden">
            {paperLoading ? (
              <div className="flex justify-center py-24">
                <Spinner size="xl" color="brand.500" />
              </div>
            ) : !paper ? (
              <p className="text-sm text-msl-muted p-8">Paper not found.</p>
            ) : (
              <>
                <header className="shrink-0 px-5 py-4 border-b border-msl-border bg-msl-surface">
                  <h2 className="font-display text-lg font-semibold text-msl-text">
                    {paper.title}
                  </h2>
                  <p className="text-xs text-msl-muted mt-0.5">
                    {[paper.sitting, paper.year, paper.level, paper.paperCode]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <ViewTab
                      active={readerView === "questions"}
                      onClick={() => setReaderView("questions")}
                      icon={<ListOrdered className="w-3.5 h-3.5" />}
                      label="Questions"
                    />
                    <ViewTab
                      active={readerView === "topics"}
                      onClick={() => setReaderView("topics")}
                      icon={<BarChart3 className="w-3.5 h-3.5" />}
                      label="Topics"
                    />
                    <ViewTab
                      active={readerView === "similar"}
                      onClick={() => setReaderView("similar")}
                      icon={<Link2 className="w-3.5 h-3.5" />}
                      label={
                        similarPairs.length
                          ? `Similar ${similarPairs.length}`
                          : "Similar"
                      }
                    />
                    <ViewTab
                      active={readerView === "insights"}
                      onClick={() => setReaderView("insights")}
                      icon={<Lightbulb className="w-3.5 h-3.5" />}
                      label="Insights"
                    />
                    <ViewTab
                      active={readerView === "pdf"}
                      onClick={() => setReaderView("pdf")}
                      icon={<FileText className="w-3.5 h-3.5" />}
                      label="Original PDF"
                    />
                  </div>
                </header>

                <div className="flex-1 min-h-0 overflow-y-auto">
                  {readerView === "pdf" ? (
                    <PastQuestionPdfViewer fileUrl={pdfUrl} title={paper.title} />
                  ) : readerView === "topics" ? (
                    <PastQuestionTopicsTab
                      paper={paper}
                      courseQuestions={courseQuestions}
                      topicFrequency={topicFrequency}
                      compareBusy={compareBusy}
                      focusTopic={focusTopic}
                      onFocusTopic={setFocusTopic}
                      onAskAbout={askAbout}
                      onOpenSitting={openSitting}
                    />
                  ) : readerView === "similar" ? (
                    <PastQuestionSimilarTab
                      links={similarPairs}
                      compareBusy={compareBusy}
                      onOpenSitting={openSitting}
                      onAskAbout={askAbout}
                    />
                  ) : readerView === "insights" ? (
                    <InsightsTab insights={insights} topicRows={topicRows} />
                  ) : (
                    <QuestionsTab
                      paper={paper}
                      highlightId={highlightId}
                      onAskAbout={askAbout}
                      questionQuery={questionQuery}
                      onQuestionQueryChange={setQuestionQuery}
                      peersByQuestion={peersByQuestion}
                      onOpenSitting={openSitting}
                    />
                  )}
                </div>
              </>
            )}
          </main>
        </div>
        {chatModal}
      </AppShell>
    );
  }

  return (
    <AppShell
      active={{ pastQuestions: true }}
      title="Past questions"
      subtitle="Browse by year, level, and paper"
    >
      {accessError ? (
        <div className="max-w-xl rounded-msl border border-msl-border bg-msl-surface p-6">
          <p className="text-msl-text font-medium">Access required</p>
          <p className="text-sm text-msl-muted mt-2">{accessError}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button as={Link} to="/personal/course" size="sm" colorScheme="brand">
              My courses
            </Button>
            <Button as={Link} to="/subscription" size="sm" variant="outline">
              AI subscription
            </Button>
          </div>
        </div>
      ) : treeLoading ? (
        <div className="flex justify-center py-24">
          <Spinner size="xl" color="brand.500" />
        </div>
      ) : (
        <div className="max-w-3xl space-y-4">
          <PastQuestionSourceFilters
            filters={sourceFilters}
            onChange={setSourceFilters}
            options={filterOptions}
            resultCount={filteredSittingCount}
          />
          <BrowseWelcome
            sourceTree={sourceTree}
            openGroup={openGroup}
            onOpenGroup={setOpenGroup}
            onOpenPaper={openPaper}
            searchActive={Boolean(
              sourceFilters.query.trim() ||
                sourceFilters.category ||
                sourceFilters.year ||
                sourceFilters.level ||
                sourceFilters.paperCode
            )}
          />
        </div>
      )}
    </AppShell>
  );
}

function ViewTab({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
        active
          ? "border-brand/40 bg-brand/10 text-brand"
          : "border-msl-border text-msl-muted hover:text-msl-text hover:border-brand/20"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function QuestionsTab({
  paper,
  highlightId,
  onAskAbout,
  questionQuery,
  onQuestionQueryChange,
  peersByQuestion,
  onOpenSitting,
}) {
  const all = paper?.questions || [];
  const needle = questionQuery.trim().toLowerCase();
  const filtered = needle
    ? all.filter((item) => {
        const num = String(item.number ?? "");
        const plain = plainTextFromHtml(item.question || "").toLowerCase();
        return num.toLowerCase().includes(needle) || plain.includes(needle);
      })
    : all;

  return (
    <div className="px-5 py-4 max-w-3xl">
      <PastQuestionQuestionFilters
        value={questionQuery}
        onChange={onQuestionQueryChange}
        total={all.length}
        shown={filtered.length}
      />
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-msl-muted py-6">No questions match this filter.</p>
        ) : null}
        {filtered.map((item) => {
        const highlighted = highlightId === item._id;
        const peers = peersByQuestion?.get(item._id) || [];
        return (
          <section
            key={item._id}
            id={`pq-q-${item._id}`}
            className={`rounded-msl border p-4 transition-shadow ${
              highlighted
                ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                : "border-msl-border bg-msl-surface"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <strong className="text-sm text-msl-text">Q{item.number || ""}</strong>
              {item.marks != null ? (
                <span className="text-xs text-msl-muted">{item.marks} marks</span>
              ) : null}
              <button
                type="button"
                onClick={() => onAskAbout(item)}
                className="ml-auto text-xs font-semibold text-brand hover:underline"
              >
                Ask AI
              </button>
            </div>
            <AiHtmlContent content={item.question} />
            {item.answer ? (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-brand font-medium">Suggested answer</summary>
                <div className="mt-2 pl-3 border-l-2 border-msl-border">
                  <AiHtmlContent content={item.answer} />
                </div>
              </details>
            ) : null}
            {item.answerNotes ? (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-msl-muted font-medium">Examiner notes</summary>
                <div className="mt-2 pl-3 border-l-2 border-msl-border">
                  <AiHtmlContent content={item.answerNotes} />
                </div>
              </details>
            ) : null}
            <PastQuestionSimilarPeers
              peers={peers}
              onOpenSitting={onOpenSitting}
              onAskAbout={onAskAbout}
            />
          </section>
        );
      })}
      </div>
    </div>
  );
}

function InsightsTab({ insights, topicRows }) {
  return (
    <div className="px-5 py-4 space-y-5 max-w-3xl">
      <PaperInsightBlock title="This sitting" insight={insights?.paper} />
      <PaperInsightBlock title="Course insight" insight={insights?.course} />
      {topicRows.length ? (
        <div className="rounded-xl border border-msl-border bg-msl-surface p-4">
          <h4 className="text-sm font-semibold text-msl-text mb-3">
            Topic frequency across sittings
          </h4>
          <ul className="space-y-2">
            {topicRows.slice(0, 20).map((row, i) => (
              <li
                key={row.topic || i}
                className="flex justify-between gap-2 text-xs border-b border-msl-border/60 pb-2 last:border-0"
              >
                <span className="text-msl-text line-clamp-2">{row.topic}</span>
                <span className="text-msl-muted shrink-0">
                  {row.count ?? "—"}
                  {row.sittings ? ` · ${row.sittings} sittings` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function SourcesPane({
  sourceFilters,
  onSourceFiltersChange,
  filterOptions,
  resultCount,
  sourceTree,
  openGroup,
  onToggleGroup,
  activePaperId,
  onOpenPaper,
  loading,
}) {
  const multiCategory = sourceTree.length > 1;
  const expandAll =
    Boolean(
      sourceFilters.query.trim() ||
        sourceFilters.category ||
        sourceFilters.year ||
        sourceFilters.level ||
        sourceFilters.paperCode
    );

  return (
    <aside className="w-[300px] shrink-0 flex flex-col border-r border-msl-border bg-msl-surface min-h-0">
      <div className="px-3 py-3 border-b border-msl-border">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-msl-muted px-1 mb-2">
          Sources
        </h2>
        <PastQuestionSourceFilters
          compact
          filters={sourceFilters}
          onChange={onSourceFiltersChange}
          options={filterOptions}
          resultCount={resultCount}
        />
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <p className="text-xs text-msl-muted px-4 py-6">Loading sources…</p>
        ) : !sourceTree.length ? (
          <p className="text-xs text-msl-muted px-4 py-6">No sources match.</p>
        ) : (
          sourceTree.map((cat) => (
            <div key={cat.categoryName} className="mb-2">
              {multiCategory ? (
                <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-msl-muted">
                  {cat.categoryName}
                </p>
              ) : null}
              {cat.years.map((yearNode) => (
                <div key={`${cat.categoryName}-${yearNode.year}`} className="mb-1">
                  <p className="px-4 py-1.5 text-xs font-bold text-msl-text bg-msl-bg/60 border-y border-msl-border/80">
                    {yearNode.year}
                  </p>
                  {yearNode.levels.map((levelNode) => (
                    <div key={`${yearNode.year}-${levelNode.level}`} className="mb-1">
                      <p className="px-4 py-1 text-[11px] font-semibold text-brand">
                        {levelNode.level}
                      </p>
                      {levelNode.groups.map((group) => {
                        const compositeKey = groupKeyForSource(
                          cat.categoryName,
                          yearNode.year,
                          levelNode.level,
                          group.key
                        );
                        const expanded = openGroup === compositeKey || expandAll;
                        return (
                          <div key={compositeKey} className="px-2">
                            <button
                              type="button"
                              onClick={() => onToggleGroup(compositeKey)}
                              className="w-full text-left rounded-xl px-3 py-2 hover:bg-brand/5 transition-colors"
                            >
                              <p className="text-sm font-semibold text-msl-text line-clamp-2">
                                {group.title}
                              </p>
                              <p className="text-[10px] text-msl-muted mt-0.5">
                                {[group.paperCode, `${group.papers.length} sittings`]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </button>
                            {expanded ? (
                              <div className="pl-2 pb-2 space-y-0.5">
                                {group.papers.map((item) => (
                                  <button
                                    key={item._id}
                                    type="button"
                                    onClick={() => onOpenPaper(item)}
                                    className={`w-full text-left rounded-lg px-3 py-2 text-xs transition-colors ${
                                      item._id === activePaperId
                                        ? "bg-brand/15 text-brand font-semibold"
                                        : "text-msl-text hover:bg-brand/5"
                                    }`}
                                  >
                                    {item.sitting || "Sitting"}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function BrowseWelcome({ sourceTree, openGroup, onOpenGroup, onOpenPaper, searchActive }) {
  if (!sourceTree.length) {
    return (
      <p className="text-sm text-msl-muted py-8">No past papers match your search.</p>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="rounded-msl border border-msl-border bg-msl-surface p-8 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-4">
          <Sparkles className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-xl font-semibold text-msl-text">
          Choose year, level, and paper
        </h2>
        <p className="text-sm text-msl-muted mt-2">
          Sources follow year → level → paper, then sittings. On the Topics tab, tap a
          frequency row to filter questions like the web notebook.
        </p>
      </div>

      {sourceTree.map((cat) => (
        <div key={cat.categoryName} className="mb-8">
          {sourceTree.length > 1 ? (
            <h3 className="text-sm font-semibold text-msl-muted uppercase tracking-wide mb-3">
              {cat.categoryName}
            </h3>
          ) : null}
          {cat.years.map((yearNode) => (
            <div key={yearNode.year} className="mb-6">
              <h4 className="text-lg font-semibold text-msl-text mb-3 px-1">{yearNode.year}</h4>
              {yearNode.levels.map((levelNode) => (
                <div key={`${yearNode.year}-${levelNode.level}`} className="mb-5 pl-2">
                  <h5 className="text-sm font-semibold text-brand mb-2">{levelNode.level}</h5>
                  <div className="space-y-2">
                    {levelNode.groups.map((group) => {
                      const compositeKey = groupKeyForSource(
                        cat.categoryName,
                        yearNode.year,
                        levelNode.level,
                        group.key
                      );
                      const open = openGroup === compositeKey || searchActive;
                      return (
                        <div
                          key={compositeKey}
                          className="rounded-msl border border-msl-border bg-msl-surface overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => onOpenGroup(open ? "" : compositeKey)}
                            className="w-full text-left px-4 py-3 hover:bg-brand/5"
                          >
                            <p className="font-medium text-msl-text">{group.title}</p>
                            <p className="text-xs text-msl-muted mt-0.5">
                              {[group.paperCode, `${group.papers.length} sittings`]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </button>
                          {open ? (
                            <ul className="border-t border-msl-border divide-y divide-msl-border">
                              {group.papers.map((p) => (
                                <li key={p._id}>
                                  <button
                                    type="button"
                                    onClick={() => onOpenPaper(p)}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand/5 flex justify-between"
                                  >
                                    <span>{p.sitting || "Sitting"}</span>
                                    <span className="text-msl-muted text-xs">
                                      {p.questionCount != null
                                        ? `${p.questionCount} questions`
                                        : "Open"}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function PaperInsightBlock({ title, insight }) {
  if (!insight) {
    return <p className="text-xs text-msl-muted">{title}: not available yet.</p>;
  }
  const topics = (insight.topics || []).slice(0, 10);
  const max = Math.max(1, ...topics.map((t) => t.count || 0));

  return (
    <div className="rounded-xl border border-msl-border bg-msl-surface p-4">
      <h4 className="text-sm font-semibold text-msl-text mb-2">{title}</h4>
      {insight.summary ? (
        <p className="text-sm text-msl-muted leading-relaxed mb-3">{insight.summary}</p>
      ) : null}
      {(insight.repeatedQuestions || []).slice(0, 3).map((item) => (
        <p key={item.theme} className="text-xs text-msl-muted mb-1">
          {item.theme}
          {item.count != null ? ` · ${item.count}×` : ""}
        </p>
      ))}
      {topics.length ? (
        <ul className="space-y-2 mt-2">
          {topics.map((topic) => (
            <li key={topic.topic || topic.label}>
              <div className="flex justify-between text-[11px] text-msl-muted mb-0.5">
                <span className="text-msl-text line-clamp-1">{topic.topic}</span>
                {topic.count != null ? <span>{topic.count}</span> : null}
              </div>
              <div className="h-1.5 rounded-full bg-msl-border overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full"
                  style={{ width: `${Math.round(((topic.count || 0) / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-msl-muted">No topics listed.</p>
      )}
    </div>
  );
}
