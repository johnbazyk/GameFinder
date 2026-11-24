import { scanContrast, type ScanContrastMode } from "./scan-contrast";

// Bound decoded working memory even when several high-resolution phone photos are selected.
export async function openScanPhoto(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 3600 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Photo unavailable");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function remoteScanImage(photo: HTMLCanvasElement) {
  const scale = Math.min(1, 2200 / Math.max(photo.width, photo.height));
  const copy = document.createElement("canvas");
  copy.width = Math.max(1, Math.round(photo.width * scale));
  copy.height = Math.max(1, Math.round(photo.height * scale));
  const ctx = copy.getContext("2d");
  if (!ctx) throw new Error("Photo unavailable");
  ctx.drawImage(photo, 0, 0, copy.width, copy.height);
  return copy.toDataURL("image/jpeg", 0.8);
}

// Swap width and height for spines. Rotating inside the original bounds clips titles.
export function rotateScanPhoto(photo: HTMLCanvasElement, direction: 1 | -1 | 2) {
  const copy = document.createElement("canvas");
  copy.width = direction === 2 ? photo.width : photo.height;
  copy.height = direction === 2 ? photo.height : photo.width;
  const ctx = copy.getContext("2d");
  if (!ctx) throw new Error("Photo unavailable");
  ctx.translate(direction > 0 ? copy.width : 0, direction !== 1 ? copy.height : 0);
  ctx.rotate((direction * Math.PI) / 2);
  ctx.drawImage(photo, 0, 0);
  return copy;
}

// A diagonal photograph needs padded bounds so the outermost titles survive rotation.
export function diagonalScanPhoto(photo: HTMLCanvasElement) {
  const side = Math.max(1, Math.ceil((photo.width + photo.height) / Math.SQRT2));
  const copy = document.createElement("canvas");
  copy.width = copy.height = Math.min(side, 2200);
  const ctx = copy.getContext("2d");
  if (!ctx) throw new Error("Photo unavailable");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, copy.width, copy.height);
  ctx.translate(copy.width / 2, copy.height / 2);
  ctx.rotate(Math.PI / 4);
  ctx.scale(copy.width / side, copy.height / side);
  ctx.drawImage(photo, -photo.width / 2, -photo.height / 2);
  return copy;
}

// Isolating a band of artwork gives the text detector a different scale and local contrast.
export function scanTitleBand(photo: HTMLCanvasElement, bottom: boolean) {
  const bandHeight = Math.max(1, Math.round(photo.height * (bottom ? 0.64 : 0.4)));
  const y = bottom ? photo.height - bandHeight : 0;
  const scale = Math.min(1, 640 / photo.width);
  const copy = document.createElement("canvas");
  copy.width = Math.max(1, Math.round(photo.width * scale));
  copy.height = Math.max(1, Math.round(bandHeight * scale));
  const ctx = copy.getContext("2d");
  if (!ctx) throw new Error("Photo unavailable");
  ctx.drawImage(photo, 0, y, photo.width, bandHeight, 0, 0, copy.width, copy.height);
  return copy;
}

export function enhancedScanPhoto(photo: HTMLCanvasElement, mode: ScanContrastMode) {
  const scale = Math.min(1, (mode === "green" ? 1200 : 1600) / Math.max(photo.width, photo.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(photo.width * scale));
  canvas.height = Math.max(1, Math.round(photo.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Photo unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  scanContrast(image.data, image.width, image.height, mode);
  ctx.putImageData(image, 0, 0);
  return canvas;
}
