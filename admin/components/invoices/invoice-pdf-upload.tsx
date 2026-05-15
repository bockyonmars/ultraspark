"use client";

import { Upload } from "lucide-react";

type InvoicePdfUploadProps = {
  isUploading?: boolean;
  onUpload: (file: File) => void;
};

export function InvoicePdfUpload({
  isUploading = false,
  onUpload,
}: InvoicePdfUploadProps) {
  return (
    <label className="inline-flex w-full sm:w-auto">
      <input
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
          event.target.value = "";
        }}
      />
      <span className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto">
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? "Uploading..." : "Upload PDF"}
      </span>
    </label>
  );
}
