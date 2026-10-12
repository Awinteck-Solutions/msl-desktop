import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useMslAi } from "../../Context/MslAiContext";
import { fetchSubscriptionResources } from "../../Services/SubscriptionApi";
import { normalizeS3Key } from "../../utils/s3Key";

export default function SubscriptionAiScopePicker({ panelOpen = true }) {
  const { scope, setAiScope } = useMslAi();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!panelOpen) return;
    setLoading(true);
    fetchSubscriptionResources()
      .then((res) => {
        if (res.ok) setResources(res.items || []);
      })
      .finally(() => setLoading(false));
  }, [panelOpen]);

  const selectedResource = useMemo(
    () => resources.find((r) => String(r._id) === String(scope.resourceId)),
    [resources, scope.resourceId]
  );

  const files = selectedResource?.files || [];

  const selectResource = (resource) => {
    if (!resource?._id) {
      setAiScope({
        courseId: null,
        lessonId: null,
        resourceId: null,
        s3Keys: [],
        label: "All subscription content",
        source: "picker",
        resourceType: null,
      });
      return;
    }
    setAiScope({
      courseId: null,
      lessonId: null,
      resourceId: String(resource._id),
      s3Keys: [],
      label: resource.title || "Resource",
      source: "picker",
      resourceType: null,
    });
  };

  const toggleFile = (file) => {
    const key = normalizeS3Key(file?.fileKey);
    if (!key || !scope.resourceId) return;
    const current = scope.s3Keys || [];
    const has = current.includes(key);
    const next = has ? current.filter((k) => k !== key) : [...current, key];
    setAiScope({
      courseId: null,
      lessonId: null,
      resourceId: scope.resourceId,
      s3Keys: next,
      label:
        next.length === 1
          ? file.fileName || scope.label
          : selectedResource?.title || scope.label,
      source: "picker",
      resourceType: file.fileType?.toLowerCase() || null,
    });
  };

  return (
    <div className="rounded-xl border border-msl-border bg-msl-bg/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-msl-text">Content scope</span>
        <ChevronDown
          className={`w-4 h-4 text-msl-muted transition ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded ? (
        <div className="px-4 pb-4 space-y-3 border-t border-msl-border/60">
          <p className="text-xs text-msl-muted pt-3">
            Optional: narrow AI to a subscriber resource or specific file. Leave on
            &quot;All content&quot; for the full library.
          </p>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-msl-muted py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading resources…
            </div>
          ) : (
            <>
              <select
                value={scope.resourceId || ""}
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) selectResource(null);
                  else selectResource(resources.find((r) => String(r._id) === id));
                }}
                className="w-full rounded-lg border border-msl-border bg-msl-surface px-3 py-2 text-sm text-msl-text"
              >
                <option value="">All subscription content</option>
                {resources.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.title}
                  </option>
                ))}
              </select>
              {files.length > 0 ? (
                <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                  {files.map((file) => {
                    const key = normalizeS3Key(file.fileKey);
                    const checked = (scope.s3Keys || []).includes(key);
                    return (
                      <li key={file._id || key}>
                        <label className="flex items-start gap-2 text-xs text-msl-text cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-0.5 accent-brand"
                            checked={checked}
                            onChange={() => toggleFile(file)}
                          />
                          <span className="line-clamp-2">
                            {file.fileName || file.fileType}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
