import { useState } from "react";
import { Progress } from "@chakra-ui/react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { fullScreenPlugin } from "@react-pdf-viewer/full-screen";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const WORKER_URL =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

export default function PastQuestionPdfViewer({ fileUrl, title }) {
  const [pageCount, setPageCount] = useState(0);
  const [pdfError, setPdfError] = useState(false);

  const zoomPluginInstance = zoomPlugin();
  const fullScreenPluginInstance = fullScreenPlugin();

  const renderPage = (props) => (
    <>
      {props.canvasLayer.children}
      <div style={{ userSelect: "none" }}>{props.textLayer.children}</div>
      {props.annotationLayer.children}
    </>
  );

  if (!fileUrl) {
    return (
      <p className="text-sm text-msl-muted p-8 text-center">
        No PDF file is attached to this paper.
      </p>
    );
  }

  if (pdfError) {
    return (
      <p className="text-sm text-red-500 p-8 text-center">
        Could not load the PDF. Check your connection and try again.
      </p>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[420px] bg-msl-bg/50">
      <div className="flex-shrink-0 px-4 py-2 border-b border-msl-border flex items-center justify-between gap-2 text-xs text-msl-muted">
        <span className="truncate">{title || "Original paper"}</span>
        {pageCount > 0 ? <span>{pageCount} pages</span> : null}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <Worker workerUrl={WORKER_URL}>
          <Viewer
            fileUrl={fileUrl}
            viewMode="SinglePage"
            renderPage={renderPage}
            onDocumentLoad={(e) => setPageCount(e.doc.numPages)}
            renderError={() => {
              setPdfError(true);
              return (
                <p className="text-sm text-red-500 p-6 text-center">Failed to load PDF.</p>
              );
            }}
            renderLoader={() => (
              <div className="p-8 flex flex-col items-center gap-2">
                <Progress size="sm" colorScheme="brand" hasStripe isIndeterminate />
                <p className="text-xs text-msl-muted">Loading PDF…</p>
              </div>
            )}
            plugins={[zoomPluginInstance, fullScreenPluginInstance]}
          />
        </Worker>
      </div>
    </div>
  );
}
