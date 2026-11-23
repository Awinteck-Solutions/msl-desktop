import { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  useToast,
} from "@chakra-ui/react";
import { ChevronLeft, FileText, Lock, PlayCircle, ShieldCheck, Smartphone } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import SideBar from "../Components/General/SideBar";
import VideoChapters from "../Components/Media/VideoChapters";
import { fetchSubscriptionResource, fetchSubscriptionStatus } from "../Services/SubscriptionApi";
import { getStoredUser } from "../Services/session";
import { useMslAi } from "../Context/MslAiContext";
import { normalizeS3Key } from "../utils/s3Key";
import { subscriptionResourceThumbnail } from "../utils/subscriptionDisplay";
import {
  lessonMediaItems,
  subscriptionLessonsSorted,
} from "../utils/subscriptionLessonMedia";

function numbered(items, kind) {
  return items
    .filter((item) => item.kind === kind)
    .map((item, index) => ({ ...item, number: index + 1 }));
}

function lessonsForPreview(resource) {
  return subscriptionLessonsSorted(resource).filter(
    (lesson) => String(lesson.status || "ACTIVE").toUpperCase() !== "DEACTIVE"
  );
}

export default function PreviewSubscriptionResource() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { setAiScope } = useMslAi();
  const videoRef = useRef(null);
  const pendingSeek = useRef(null);
  const scrollRef = useRef(null);
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [resource, setResource] = useState(null);
  const [tab, setTab] = useState("content");
  const [playUrl, setPlayUrl] = useState("");
  const [chapters, setChapters] = useState([]);

  const lessons = useMemo(() => lessonsForPreview(resource), [resource]);

  useEffect(() => {
    if (!getStoredUser()?.token) {
      navigate("/login");
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setHasAccess(false);
    setPlayUrl("");
    setChapters([]);

    const fromNav =
      location.state?.resource && String(location.state.resource._id) === String(id)
        ? location.state.resource
        : null;
    if (fromNav) setResource(fromNav);

    (async () => {
      const [status, detail] = await Promise.all([
        fetchSubscriptionStatus(),
        fetchSubscriptionResource(id),
      ]);
      if (cancelled) return;
      setHasAccess(Boolean(status.ok && status.data?.hasAccess));
      if (detail.ok && detail.resource) {
        setResource(detail.resource);
      } else if (!fromNav) {
        setResource(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, navigate, location.state?.resource]);

  useEffect(() => {
    if (!resource?._id) return;
    setAiScope({
      courseId: null,
      lessonId: null,
      resourceId: String(resource._id),
      label: resource.title || "Subscription resource",
      source: "page",
      resourceType: null,
    });
  }, [resource?._id, resource?.title, setAiScope]);

  useEffect(() => {
    if (!playUrl || !scrollRef.current) return;
    scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [playUrl]);

  const seekVideo = (seconds) => {
    const node = videoRef.current;
    if (node && node.readyState >= 1) {
      node.currentTime = seconds;
      node.play?.().catch(() => {});
      pendingSeek.current = null;
      return;
    }
    pendingSeek.current = seconds;
  };

  const blockUse = () => {
    toast({
      title: "Subscription required",
      description: "You can preview this resource. An active plan is required to play videos and open PDFs.",
      status: "info",
      duration: 5000,
      isClosable: true,
    });
  };

  const openMedia = (lesson, item, seconds) => {
    if (!hasAccess) {
      blockUse();
      return;
    }
    const key = normalizeS3Key(item.fileKey);
    setAiScope({
      courseId: null,
      lessonId: lesson?._id ? String(lesson._id) : null,
      resourceId: String(resource._id),
      s3Keys: key ? [key] : [],
      label: lesson?.title ? `${lesson.title} · ${item.label}` : item.label,
      source: "page",
      resourceType: item.kind === "pdf" ? "pdf" : "video",
    });

    if (item.kind === "pdf") {
      navigate(`/preview/pdf/${resource._id}`, {
        state: {
          data: item.fileKey,
          online: true,
          returnTo: `/subscription/resource/${resource._id}`,
          allowWithoutEnrollment: true,
        },
      });
      return;
    }

    setChapters(item.timestamps || []);
    setPlayUrl(item.url);
    if (seconds != null) pendingSeek.current = seconds;
  };

  const shell = (children) => (
    <div className="flex h-screen bg-msl-bg overflow-hidden">
      <SideBar subscription />
      {children}
    </div>
  );

  if (loading) {
    return shell(
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="animate-pulse rounded-msl bg-msl-accent/60 h-8 w-48" />
        <div className="animate-pulse rounded-msl bg-msl-accent/60 aspect-video w-full" />
        <div className="animate-pulse rounded-msl bg-msl-accent/60 h-10 w-2/3" />
        <div className="animate-pulse rounded-msl bg-msl-accent/60 h-48 w-full" />
      </div>
    );
  }

  if (!resource) {
    return shell(
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6">
        <div className="max-w-lg msl-card p-8">
          <p className="text-msl-text">Resource not found.</p>
          <Link to="/subscription" className="inline-block mt-4 text-sm font-semibold text-brand">
            Back to library
          </Link>
        </div>
      </div>
    );
  }

  const thumb = subscriptionResourceThumbnail(resource);

  return shell(
    <div ref={scrollRef} className="flex-1 overflow-y-auto min-w-0">
      <div className="px-6 lg:px-10 py-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/subscription"
            className="inline-flex items-center gap-1.5 text-sm text-msl-muted hover:text-brand transition-colors"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            Back to resources
          </Link>
          {hasAccess ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-msl">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
              Subscribed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-msl">
              <Lock className="w-3.5 h-3.5" strokeWidth={2} />
              Preview only
            </span>
          )}
        </div>

        {!hasAccess ? (
          <div className="glass-card rounded-msl p-4 flex items-start gap-3 border-amber-500/25 bg-amber-500/5">
            <Smartphone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-medium text-msl-text">Subscription required to use these lessons</p>
              <p className="text-xs text-msl-muted mt-1">
                Browse the overview and lesson list here. Subscribe on the mobile app to watch videos and open PDFs.
              </p>
              <Button as={Link} to="/profile" mt={3} size="sm" variant="outline">
                View subscription on profile
              </Button>
            </div>
          </div>
        ) : null}

        <div className="rounded-msl overflow-hidden border border-msl-border bg-black shadow-card">
          {!playUrl ? (
            <div className="aspect-video bg-black relative">
              <img className="object-cover w-full h-full" src={thumb} alt={resource.title || "Resource"} />
            </div>
          ) : (
            <video
              ref={videoRef}
              key={playUrl}
              className="w-full aspect-video bg-black"
              controls
              controlsList="nodownload"
              src={playUrl}
              onLoadedMetadata={() => {
                if (pendingSeek.current == null || !videoRef.current) return;
                videoRef.current.currentTime = pendingSeek.current;
                pendingSeek.current = null;
              }}
            />
          )}
          {playUrl ? <VideoChapters markers={chapters} onSeek={seekVideo} /> : null}
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-msl-text tracking-tight leading-tight">
            {resource.title}
          </h1>
          <p className="text-sm text-msl-muted">
            {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"} · Self-paced learning
          </p>
        </div>

        <div className="glass-card rounded-msl overflow-hidden">
          <div className="flex border-b border-msl-border">
            <button
              type="button"
              onClick={() => setTab("overview")}
              className={`flex-1 px-4 py-3.5 text-sm font-semibold transition-colors ${
                tab === "overview"
                  ? "text-brand border-b-2 border-brand bg-brand/5"
                  : "text-msl-muted hover:text-msl-text hover:bg-msl-accent/30"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setTab("content")}
              className={`flex-1 px-4 py-3.5 text-sm font-semibold transition-colors ${
                tab === "content"
                  ? "text-brand border-b-2 border-brand bg-brand/5"
                  : "text-msl-muted hover:text-msl-text hover:bg-msl-accent/30"
              }`}
            >
              Course content
              <span className="ml-1.5 text-xs font-normal text-msl-muted">({lessons.length})</span>
            </button>
          </div>

          {tab === "overview" ? (
            <div className="p-6 lg:p-8">
              <h2 className="font-display text-lg font-semibold text-msl-text mb-3">About this resource</h2>
              <p className="text-sm text-msl-muted leading-relaxed whitespace-pre-line">
                {resource.description || "Subscriber lessons for this resource."}
              </p>
            </div>
          ) : (
            <div className="px-2 py-3">
              {lessons.length ? (
                <Accordion allowMultiple allowToggle defaultIndex={[0]} className="text-msl-text">
                  {lessons.map((lesson) => {
                    const media = lessonMediaItems(lesson);
                    const videos = [
                      ...numbered(media, "video"),
                      ...numbered(media, "audio"),
                    ];
                    const pdfs = numbered(media, "pdf");
                    const summary = [
                      videos.length ? `${videos.length} ${videos.length === 1 ? "video" : "videos"}` : "",
                      pdfs.length ? `${pdfs.length} ${pdfs.length === 1 ? "PDF" : "PDFs"}` : "",
                    ].filter(Boolean).join(" · ");
                    return (
                      <AccordionItem key={lesson._id}>
                        <h2>
                          <AccordionButton className="!py-3.5 hover:!bg-msl-accent/40 rounded-lg !px-3 !text-msl-text !bg-transparent">
                            <Box as="span" flex="1" textAlign="left">
                              <p className="text-sm font-medium text-msl-text pr-2">{lesson.title}</p>
                              {summary ? (
                                <p className="text-xs font-normal text-msl-muted mt-0.5">{summary}</p>
                              ) : null}
                            </Box>
                            <AccordionIcon className="!text-msl-muted" />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                          {lesson.description ? (
                            <p className="text-xs text-msl-muted mb-3 leading-relaxed line-clamp-3 whitespace-pre-line">
                              {lesson.description}
                            </p>
                          ) : null}
                          {videos.map((item) => (
                            <div key={item.id} className={`lesson-resource-row ${hasAccess ? "hover:border-brand/30 hover:bg-brand/5" : "opacity-60"}`}>
                              <button
                                type="button"
                                onClick={() => openMedia(lesson, item)}
                                className="flex w-full items-center gap-2 p-3 text-left text-xs"
                              >
                                <PlayCircle className="w-4 h-4 text-brand shrink-0" strokeWidth={1.75} />
                                <span className="text-msl-text font-medium">
                                  {item.kind === "audio" ? "Audio" : "Video"} {item.number}
                                </span>
                                {!hasAccess ? <Lock className="w-3.5 h-3.5 text-msl-muted ml-auto" strokeWidth={2} /> : null}
                              </button>
                            </div>
                          ))}
                          {pdfs.map((item) => (
                            <div key={item.id} className={`lesson-resource-row ${hasAccess ? "hover:border-brand/30 hover:bg-brand/5" : "opacity-60"}`}>
                              <button
                                type="button"
                                onClick={() => openMedia(lesson, item)}
                                className="flex w-full items-center gap-2 p-3 text-left text-xs"
                              >
                                <FileText className="w-4 h-4 text-brand shrink-0" strokeWidth={1.75} />
                                <span className="text-msl-text font-medium">PDF {item.number}</span>
                                {!hasAccess ? <Lock className="w-3.5 h-3.5 text-msl-muted ml-auto" strokeWidth={2} /> : null}
                              </button>
                            </div>
                          ))}
                          {!videos.length && !pdfs.length ? (
                            <p className="text-xs text-msl-muted px-3">No media in this lesson yet.</p>
                          ) : null}
                        </AccordionPanel>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <p className="text-center text-sm text-msl-muted py-6">Not available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
