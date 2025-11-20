import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

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
  const dashboardRef = useRef<any>(null);

  useEffect(() => {
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

    const dashboard = uppy.use(Dashboard, {
      inline: false,
      trigger: null,
      proudlyDisplayPoweredByUppy: false,
      closeModalOnClickOutside: true,
      closeAfterFinish: false,
    });

    uppyRef.current = uppy;
    dashboardRef.current = dashboard;

    return () => {
      uppy.cancelAll();
      uppy.clear();
    };
  }, [maxNumberOfFiles, maxFileSize, onGetUploadParameters, onComplete]);

  useEffect(() => {
    if (dashboardRef.current) {
      if (showModal) {
        dashboardRef.current.openModal();
      } else {
        dashboardRef.current.closeModal();
      }
    }
  }, [showModal]);

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName} data-testid="button-open-uploader">
        {children}
      </Button>
    </div>
  );
}
