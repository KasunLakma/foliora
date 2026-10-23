"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import { MAX_PHOTO_BYTES } from "@/modules/photos/paths";
import { getUploadSignatureAction, registerPhotoAction } from "@/modules/photos/actions";

export function PhotoUploader({ remaining }: { remaining: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function uploadOne(file: File): Promise<string | null> {
    if (file.size > MAX_PHOTO_BYTES) return format(t.photos.tooBig, { name: file.name });
    if (!file.type.startsWith("image/")) return format(t.photos.failed, { name: file.name });

    // 1. ask our server for permission to upload to this account's folder
    const sig = await getUploadSignatureAction();
    if ("error" in sig) return sig.error;

    // 2. send the picture straight to Cloudinary (it never passes through our server)
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", sig.apiKey);
    body.append("timestamp", String(sig.timestamp));
    body.append("signature", sig.signature);
    body.append("folder", sig.folder);
    body.append("allowed_formats", sig.allowedFormats);

    let uploaded: { public_id: string; width: number; height: number; bytes: number; format: string };
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST",
        body,
      });
      if (!response.ok) return format(t.photos.failed, { name: file.name });
      uploaded = await response.json();
    } catch {
      return format(t.photos.failed, { name: file.name });
    }

    // 3. tell our server the picture is there, so it can be saved
    const saved = await registerPhotoAction({
      publicId: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
      bytes: uploaded.bytes,
      format: uploaded.format,
    });
    return saved.error ?? null;
  }

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(remaining, 0));
    event.target.value = ""; // allow choosing the same file again
    if (files.length === 0) {
      setErrors([format(t.photos.limit, { max: "" }).trim()]);
      return;
    }

    setBusy(true);
    setErrors([]);
    const problems: string[] = [];
    let added = 0;

    for (const [index, file] of files.entries()) {
      setStatus(format(t.photos.uploading, { current: index + 1, total: files.length }));
      const problem = await uploadOne(file);
      if (problem) problems.push(problem);
      else added += 1;
    }

    setBusy(false);
    setErrors(problems);
    setStatus(added > 0 ? format(t.photos.done, { count: added }) : null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        className={cn(
          "glass-card flex cursor-pointer flex-col items-center gap-2 rounded-[1.75rem] border-dashed p-6 text-center transition",
          busy ? "opacity-60" : "hover:bg-white/8",
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={busy || remaining <= 0}
          onChange={onChange}
          className="sr-only"
        />
        <span className="grid size-12 place-items-center rounded-2xl bg-brand/12 text-brand">
          <Icon name="image" size={24} />
        </span>
        <span className="font-semibold">{t.photos.upload}</span>
        <span className="text-xs text-muted-foreground">{t.photos.hint}</span>
      </label>

      <p aria-live="polite" className="px-1 text-sm font-medium text-success empty:hidden">
        {status}
      </p>
      {errors.map((message) => (
        <p key={message} role="alert" className="rounded-2xl bg-danger/12 px-4 py-3 text-sm font-medium text-danger">
          {message}
        </p>
      ))}
    </div>
  );
}
