"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2, Check } from "lucide-react";
import { useTranslation } from "@/i18n";
import { useToast } from "@/providers/ToastProvider";
import { uploadImage, type UploadScope } from "@/lib/api/uploads";

// Reusable image picker: user selects a file → it's uploaded, compressed to
// WebP on the server, and `onChange` gets the stored URL. Shows a live preview
// and a remove button. `value` is the current stored URL ('' when none).
export function ImageUpload({
  value,
  onChange,
  scope,
  variant = "wide",
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  scope: UploadScope;
  // 'wide' → banner-style rectangle; 'avatar' → small round (logos).
  variant?: "wide" | "avatar";
  label?: string;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Removing an image is destructive, so require a second confirming click
  // (shown as an overlay) rather than clearing it on the first click.
  const [confirming, setConfirming] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, scope);
      onChange(url);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("uploadFailed"),
        "error",
      );
    } finally {
      setUploading(false);
    }
  }

  const isAvatar = variant === "avatar";
  const frameClass = isAvatar
    ? "w-20 h-20 rounded-full"
    : "w-full h-32 rounded-lg";

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
          {label}
        </label>
      )}
      <div className={`relative ${isAvatar ? "w-20" : "w-full"}`}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`${frameClass} overflow-hidden border-1.5 border-dashed border-(--gray-300) bg-(--gray-50) flex items-center justify-center text-(--gray-400) cursor-pointer transition-colors hover:border-(--brand-500) hover:text-(--brand-500) disabled:cursor-not-allowed`}
          aria-label={t("uploadImage")}
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded WebP served from /uploads; next/image needs configured sizes we don't want here
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <ImagePlus size={isAvatar ? 18 : 22} />
              {!isAvatar && (
                <span className="text-[0.75rem] font-medium">
                  {t("uploadImage")}
                </span>
              )}
            </div>
          )}
        </button>
        {value && !uploading && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-(--danger) text-white flex items-center justify-center shadow cursor-pointer"
            aria-label={t("removeImage")}
          >
            <X size={13} />
          </button>
        )}
        {confirming && (
          <div
            className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-black/65 backdrop-blur-[1px] p-1.5 text-center ${isAvatar ? "rounded-full" : "rounded-lg"}`}
          >
            {!isAvatar && (
              <span className="text-white text-[0.72rem] font-semibold leading-tight px-1">
                {t("removeImageConfirm")}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setConfirming(false);
                }}
                className="w-7 h-7 rounded-full bg-(--danger) text-white flex items-center justify-center shadow cursor-pointer hover:opacity-90"
                aria-label={t("remove")}
                title={t("remove")}
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="w-7 h-7 rounded-full bg-white/25 text-white flex items-center justify-center cursor-pointer hover:bg-white/35"
                aria-label={t("cancel")}
                title={t("cancel")}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </div>
    </div>
  );
}
