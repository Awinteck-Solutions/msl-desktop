import { useState } from "react";
import { Progress } from "@chakra-ui/react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { fullScreenPlugin } from "@react-pdf-viewer/full-screen";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { subscriptionFileKind } from "../../utils/subscriptionDisplay";

const WORKER_URL =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

const viewerShellClass =
  "select-none subscription-asset-viewer";

export default function SubscriptionAssetViewer({ file, fileUrl, title }) {
  const [pageCount, setPageCount] = useState(0);
  const [pdfError, setPdfError] = useState(false);
  const kind = subscriptionFileKind(file);

  const zoomPluginInstance = zoomPlugin();
  const fullScreenPluginInstance = fullScreenPlugin();

  const blockContextMenu = (e) => e.preventDefault();

  if (!fileUrl) {
    return (
      <p className="text-sm text-msl-muted p-8 text-center">
        This asset is not available for preview.
      </p>
    );
  }

  if (kind === "pdf") {
    if (pdfError) {
      return (
        <p className="text-sm text-red-500 p-8 text-center">
          Could not load the PDF. Check your connection and try again.
        </p>
      );
    }

    return (
      <div
        className={`flex flex-col h-full min-h-[420px] bg-msl-bg/50 ${viewerShellClass}`}
        onContextMenu={blockContextMenu}
      >
        <div className="flex-shrink-0 px-4 py-2 border-b border-msl-border flex items-center justify-between gap-2 text-xs text-msl-muted">
          <span className="truncate">{title || file?.fileName || "PDF"}</span>
          {pageCount > 0 ? <span>{pageCount} pages</span> : null}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <Worker workerUrl={WORKER_URL}>
            <Viewer
              fileUrl={fileUrl}
              plugins={[zoomPluginInstance, fullScreenPluginInstance]}
              renderLoader={(percent) => (
                <div className="p-8">
                  <Progress value={percent} size="xs" colorScheme="brand" />
                </div>
              )}
              onDocumentLoad={(e) => setPageCount(e.doc.numPages)}
              renderPage={(props) => (
                <>
                  {props.canvasLayer.children}
                  <div style={{ userSelect: "none" }}>{props.textLayer.children}</div>
                  {props.annotationLayer.children}
                </>
              )}
              onDocumentLoadFail={() => setPdfError(true)}
            />
          </Worker>
        </div>
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div
        className={`p-4 md:p-6 ${viewerShellClass}`}
        onContextMenu={blockContextMenu}
      >
        <video
          key={fileUrl}
          src={fileUrl}
          controls
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          className="w-full max-h-[70vh] rounded-msl bg-black"
          playsInline
        >
          <track kind="captions" />
        </video>
        <p className="text-xs text-msl-muted mt-3">
          Preview only — downloading is disabled in the desktop app.
        </p>
      </div>
    );
  }

  if (kind === "audio") {
    return (
      <div
        className={`p-6 md:p-10 ${viewerShellClass}`}
        onContextMenu={blockContextMenu}
      >
        <p className="text-sm font-medium text-msl-text mb-4">
          {title || file?.fileName || "Audio"}
        </p>
        <audio
          key={fileUrl}
          src={fileUrl}
          controls
          controlsList="nodownload"
          className="w-full"
        />
        <p className="text-xs text-msl-muted mt-3">
          Preview only — downloading is disabled in the desktop app.
        </p>
      </div>
    );
  }

  return (
    <p className="text-sm text-msl-muted p-8 text-center">
      This file type cannot be previewed in the app.
    </p>
  );
}
