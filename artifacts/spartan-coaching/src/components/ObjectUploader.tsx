import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import "@uppy/core/css/style.css";
import "@uppy/dashboard/css/style.css";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const uppyRef = useRef<Uppy | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const uppy = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowModal(false);
      });

    uppy.use(Dashboard, {
      inline: true,
      target: containerRef.current,
      proudlyDisplayPoweredByUppy: false,
      height: 400,
    });

    uppyRef.current = uppy;

    return () => {
      uppy.cancelAll();
      uppy.clear();
    };
  }, [maxNumberOfFiles, maxFileSize, onGetUploadParameters, onComplete]);

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName} data-testid="button-open-uploader">
        {children}
      </Button>

      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Upload PDF</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowModal(false)}
                data-testid="button-close-uploader"
              >
                ✕
              </Button>
            </div>
            <div ref={containerRef} />
          </div>
        </div>
      )}
    </div>
  );
}
