import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, FileText, Music, Video } from "lucide-react";
import { Button } from "@chakra-ui/react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import AppShell from "../Components/Layout/AppShell";
import SubscriptionAssetViewer from "../Components/Subscription/SubscriptionAssetViewer";
import SubscriptionResourcePreviewSkeleton from "../Components/Subscription/SubscriptionResourcePreviewSkeleton";
import {
  subscriptionFileKind,
  subscriptionResourceFileUrl,
  subscriptionResourceThumbnail,
} from "../utils/subscriptionDisplay";
import { fetchSubscriptionResources, fetchSubscriptionStatus } from "../Services/SubscriptionApi";
import { getStoredUser } from "../Services/session";
import { useMslAi } from "../Context/MslAiContext";
import { normalizeS3Key } from "../utils/s3Key";

function fileIcon(kind) {
  if (kind === "video") return Video;
  if (kind === "audio") return Music;
  return FileText;
}

export default function PreviewSubscriptionResource() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { setAiScope } = useMslAi();
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [resource, setResource] = useState(null);
  const [activeFileId, setActiveFileId] = useState(null);

  const files = useMemo(
    () => (resource?.files || []).filter((f) => subscriptionResourceFileUrl(f)),
    [resource]
  );

  const activeFile = useMemo(() => {
    if (!files.length) return null;
    if (activeFileId) {
      return files.find((f) => String(f._id) === String(activeFileId)) || files[0];
    }
    return files[0];
  }, [files, activeFileId]);

  useEffect(() => {
    if (!getStoredUser()?.token) {
      navigate("/login");
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setDenied(false);
    setActiveFileId(null);

    const fromNav =
      location.state?.resource &&
      String(location.state.resource._id) === String(id)
        ? location.state.resource
        : null;

    (async () => {
      const status = await fetchSubscriptionStatus();
      if (cancelled) return;
      if (!status.ok || !status.data?.hasAccess) {
        setDenied(true);
        setResource(null);
        setLoading(false);
        return;
      }

      if (fromNav) {
        setResource(fromNav);
        setLoading(false);
        return;
      }

      const res = await fetchSubscriptionResources();
      if (cancelled) return;
      if (res.ok) {
        const found = (res.items || []).find((r) => String(r._id) === String(id));
        setResource(found || null);
      } else {
        setResource(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, navigate, location.state?.resource]);

  useEffect(() => {
    if (!resource?._id || !activeFile) return;
    const key = normalizeS3Key(activeFile.fileKey);
    setAiScope({
      courseId: null,
      lessonId: null,
      resourceId: String(resource._id),
      s3Keys: key ? [key] : [],
      label: activeFile.fileName || resource.title,
      source: "page",
      resourceType: subscriptionFileKind(activeFile),
    });
  }, [resource?._id, resource?.title, activeFile, setAiScope]);

  if (loading) {
    return (
      <AppShell active={{ subscription: true }} title="Resource" noPadding>
        <SubscriptionResourcePreviewSkeleton />
      </AppShell>
    );
  }

  if (denied) {
    return (
      <AppShell active={{ subscription: true }} title="Resource">
        <div className="max-w-lg msl-card p-8">
          <p className="font-medium text-msl-text">Subscription required</p>
          <p className="text-sm text-msl-muted mt-2">
            Active AI subscription is required to preview subscriber resources.
          </p>
          <Button as={Link} to="/profile" mt={4} size="sm" colorScheme="brand">
            View subscription on profile
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!resource) {
    return (
      <AppShell active={{ subscription: true }} title="Resource">
        <div className="max-w-lg msl-card p-8">
          <p className="text-msl-text">Resource not found.</p>
          <Button as={Link} to="/subscription" mt={4} size="sm" variant="outline">
            Back to library
          </Button>
        </div>
      </AppShell>
    );
  }

  const thumb = subscriptionResourceThumbnail(resource);
  const activeUrl = activeFile ? subscriptionResourceFileUrl(activeFile) : "";

  return (
    <AppShell
      active={{ subscription: true }}
      noPadding
      headerRight={
        <Button
          as={Link}
          to="/subscription"
          size="sm"
          variant="ghost"
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          Library
        </Button>
      }
    >
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] min-h-0">
        <aside className="lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-msl-border bg-msl-surface overflow-y-auto">
          <div className="p-4 border-b border-msl-border">
            <div className="aspect-video rounded-lg overflow-hidden bg-brand/10 mb-3">
              <img src={thumb} alt="" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-display text-lg font-semibold text-msl-text">
              {resource.title}
            </h1>
            {resource.categoryId?.name ? (
              <p className="text-xs text-brand font-semibold mt-1 uppercase tracking-wide">
                {resource.categoryId.name}
              </p>
            ) : null}
            {resource.description ? (
              <p className="text-sm text-msl-muted mt-2">{resource.description}</p>
            ) : null}
          </div>
          <div className="p-3">
            <p className="text-xs font-semibold text-msl-muted uppercase tracking-wide px-2 mb-2">
              Assets
            </p>
            {files.length === 0 ? (
              <p className="text-sm text-msl-muted px-2 py-4">No previewable files yet.</p>
            ) : (
              <ul className="space-y-1">
                {files.map((file) => {
                  const kind = subscriptionFileKind(file);
                  const Icon = fileIcon(kind);
                  const active = String(file._id) === String(activeFile?._id);
                  return (
                    <li key={file._id || file.fileKey}>
                      <button
                        type="button"
                        onClick={() => setActiveFileId(file._id)}
                        className={`w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          active
                            ? "bg-brand/10 text-brand border border-brand/20"
                            : "text-msl-text hover:bg-msl-accent/50 border border-transparent"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                        <span className="line-clamp-2">{file.fileName || kind}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
        <main className="flex-1 min-h-0 flex flex-col bg-msl-bg/30">
          <SubscriptionAssetViewer
            file={activeFile}
            fileUrl={activeUrl}
            title={activeFile?.fileName || resource.title}
          />
        </main>
      </div>
    </AppShell>
  );
}
