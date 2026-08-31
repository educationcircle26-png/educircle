import "server-only";

/**
 * Shared validation for user-supplied images.
 *
 * The storage policies decide *where* a file may go; this decides whether
 * it is an image at all and small enough. Both checks run server-side —
 * the accept attribute on a file input is a hint to the file picker, not a
 * constraint anyone has to respect.
 */

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type ImageCheck =
  | { ok: true; ext: string; file: File }
  | { ok: false; reason: string };

export function checkImage(value: FormDataEntryValue | null): ImageCheck {
  if (!value || typeof value === "string") {
    return { ok: false, reason: "no_file" };
  }
  const file = value as File;
  if (file.size === 0) return { ok: false, reason: "no_file" };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, reason: "too_large" };

  const ext = ALLOWED.get(file.type);
  if (!ext) return { ok: false, reason: "wrong_type" };

  return { ok: true, ext, file };
}

export function uploadErrorMessage(reason: string) {
  switch (reason) {
    case "too_large":
      return "That image is over 4 MB. Please pick a smaller one.";
    case "wrong_type":
      return "Please choose a JPG, PNG or WebP image.";
    default:
      return "That image could not be uploaded. Please try again.";
  }
}
