"use client";

import { File as FileIcon, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  FILE_RULES,
  formatFileSize,
  validateFile,
  type FileItemType,
} from "@/lib/file-upload";
import type { ItemFileData } from "@/lib/db/items";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  type: FileItemType;
  value: ItemFileData | null;
  onChange: (file: ItemFileData | null) => void;
  disabled?: boolean;
}

function uploadWithProgress(
  type: FileItemType,
  file: File,
  onProgress: (percent: number) => void,
): { promise: Promise<ItemFileData>; abort: () => void } {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<ItemFileData>((resolve, reject) => {
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      let body: { error?: string } & Partial<ItemFileData> = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Fall through to the generic error below
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.key) {
        resolve(body as ItemFileData);
      } else {
        reject(new Error(body.error ?? "Upload failed. Please try again."));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed. Please try again."));
    xhr.onabort = () => reject(new Error("Upload cancelled"));

    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);
    xhr.send(formData);
  });
  return { promise, abort: () => xhr.abort() };
}

function UploadProgress({ percent }: { percent: number }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <p>Uploading... {percent}%</p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full bg-primary transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function UploadedFileCard({
  file,
  previewUrl,
  disabled,
  onRemove,
}: {
  file: ItemFileData;
  previewUrl: string | null;
  disabled?: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- local blob preview
        <img
          src={previewUrl}
          alt={file.name}
          className="max-h-48 w-full rounded-md bg-muted object-contain"
        />
      )}
      <div className="flex items-center gap-3">
        <FileIcon className="size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Remove file"
          disabled={disabled}
          onClick={onRemove}
        >
          <X />
        </Button>
      </div>
    </div>
  );
}

export function FileUpload({ type, value, onChange, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const rule = FILE_RULES[type];

  useEffect(() => {
    return () => {
      abortRef.current?.();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFile(file: File) {
    setError(null);
    const validationError = validateFile(type, file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPreviewUrl(type === "image" ? URL.createObjectURL(file) : null);
    setProgress(0);
    const upload = uploadWithProgress(type, file, setProgress);
    abortRef.current = upload.abort;
    try {
      onChange(await upload.promise);
    } catch (uploadError) {
      setPreviewUrl(null);
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      abortRef.current = null;
      setProgress(null);
    }
  }

  function handleRemove() {
    setPreviewUrl(null);
    setError(null);
    onChange(null);
  }

  const isUploading = progress !== null;

  if (value && !isUploading) {
    return (
      <UploadedFileCard
        file={value}
        previewUrl={previewUrl}
        disabled={disabled}
        onRemove={handleRemove}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        aria-label={`Choose a ${type} to upload`}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !disabled && !isUploading) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files[0];
          if (file && !disabled && !isUploading) void handleFile(file);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm transition-colors",
          isDragging ? "border-primary bg-primary/5" : "hover:bg-muted/50",
          (disabled || isUploading) && "cursor-not-allowed opacity-60",
        )}
      >
        <UploadCloud className="size-6 text-muted-foreground" />
        {isUploading ? (
          <UploadProgress percent={progress} />
        ) : (
          <>
            <p>Drag and drop a {type}, or click to browse</p>
            <p className="text-xs text-muted-foreground">
              {rule.extensions.join(", ")} · up to {formatFileSize(rule.maxSize)}
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={rule.extensions.join(",")}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
