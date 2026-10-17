/**
 * Photo handling for profile pictures and Story photos.
 *
 * Every photo is decoded and re-drawn onto a canvas before it is kept, which
 * throws away hidden metadata such as GPS location and camera details
 * (AC-S11-07) and shrinks it to a sensible size.
 *
 * PROTOTYPE: photos stay in this browser tab. In production they go to
 * private object storage and pass automated safety checks (including
 * mandatory known-abuse-image hash matching) and human review before anyone
 * else can see them.
 */

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PROFILE_MAX_BYTES = 5 * 1024 * 1024;
export const STORY_MAX_BYTES = 10 * 1024 * 1024;

/** Returns a member-facing problem, or null if the file can be used. */
export function photoProblem(file: { type: string; size: number }, maxBytes: number): string | null {
  if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) return "Please choose a JPG, PNG or WebP photo.";
  if (file.size > maxBytes) return `Please choose a photo under ${Math.round(maxBytes / 1024 / 1024)} MB.`;
  return null;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("unreadable")); };
    img.src = url;
  });
}

/**
 * Re-encodes a photo as JPEG. `square` center-crops it (profile pictures);
 * otherwise it keeps its shape. `maxSide` caps the longest edge in pixels.
 */
export async function preparePhoto(file: File, opts: { square: boolean; maxSide: number }): Promise<{ src: string; width: number; height: number }> {
  const img = await loadImage(file);
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (opts.square) {
    const side = Math.min(sw, sh);
    sx = (sw - side) / 2; sy = (sh - side) / 2; sw = sh = side;
  }
  const scale = Math.min(1, opts.maxSide / Math.max(sw, sh));
  const width = Math.round(sw * scale), height = Math.round(sh * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.fillStyle = "#FFFFFF";              // flatten transparent PNGs
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
  return { src: canvas.toDataURL("image/jpeg", 0.82), width, height };
}
