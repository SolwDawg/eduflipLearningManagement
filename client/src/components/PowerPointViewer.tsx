import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, ExternalLink, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

interface PowerPointViewerProps {
  fileUrl: string;
  width?: string | number;
  height?: string | number;
}

/**
 * PowerPoint Viewer Component
 *
 * This component provides multiple options to view PowerPoint presentations:
 * 1. Microsoft Office Online viewer (primary)
 * 2. Google Docs viewer (fallback)
 * 3. Direct download link
 *
 * It includes error handling and fallback mechanisms if the primary viewer fails.
 */
const PowerPointViewer: React.FC<PowerPointViewerProps> = ({
  fileUrl,
  width = "100%",
  height = 600,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);

  // Microsoft Office Online viewer URL
  const msViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    fileUrl
  )}`;

  // Google Docs viewer as fallback
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    fileUrl
  )}&embedded=true`;

  // Current viewer URL based on selected option
  const viewerUrl = useGoogleViewer ? googleViewerUrl : msViewerUrl;

  // Reset error state when fileUrl changes
  useEffect(() => {
    setError(false);
    setLoading(true);
  }, [fileUrl]);

  const handleIframeError = () => {
    if (!useGoogleViewer) {
      // If Microsoft viewer fails, try Google viewer
      setUseGoogleViewer(true);
      toast.info("Đang chuyển sang trình xem thay thế...");
    } else {
      // If both viewers fail, show error
      setError(true);
      toast.error("Không thể hiển thị bài trình bày. Hãy tải xuống thay thế.");
    }
    setLoading(false);
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const switchViewer = () => {
    setUseGoogleViewer(!useGoogleViewer);
    setLoading(true);
    setError(false);
    toast.info(
      `Đang chuyển sang trình xem ${
        useGoogleViewer ? "Microsoft" : "Google"
      }...`
    );
  };

  return (
    <div className="powerpoint-viewer-container flex flex-col gap-2">
      {/* Viewer controls */}
      <div className="flex flex-wrap gap-2 justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={switchViewer}
          className="text-xs"
        >
          <RefreshCcw className="w-3 h-3 mr-1" />
          Thử {useGoogleViewer ? "Microsoft" : "Google"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(fileUrl, "_blank")}
          className="text-xs"
        >
          <FileDown className="w-3 h-3 mr-1" />
          Tải xuống
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(viewerUrl, "_blank")}
          className="text-xs"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Mở trong tab mới
        </Button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center h-20 bg-muted/20">
          <div className="loader"></div>
          <p className="ml-2 text-sm text-muted-foreground">
            Đang tải bài trình bày...
          </p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/10 h-[300px]">
          <div className="text-destructive mb-4 text-lg">
            Không thể hiển thị bài trình bày
          </div>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Trình xem bài trình bày không thể truy cập tệp này. Điều này có thể
            do tệp không công khai hoặc định dạng không được hỗ trợ.
          </p>
          <Button
            onClick={() => window.open(fileUrl, "_blank")}
            variant="default"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Tải xuống bài trình bày thay thế
          </Button>
        </div>
      )}

      {/* Only show iframe if not in error state */}
      {!error && (
        <iframe
          src={viewerUrl}
          width={width}
          height={height}
          frameBorder="0"
          title="Bài trình bày PowerPoint"
          className="rounded-md border"
          allowFullScreen
          onError={handleIframeError}
          onLoad={handleIframeLoad}
          style={{ display: loading ? "none" : "block" }}
        />
      )}

      <style jsx>{`
        .loader {
          border: 3px solid #f3f3f3;
          border-radius: 50%;
          border-top: 3px solid #3498db;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default PowerPointViewer;
