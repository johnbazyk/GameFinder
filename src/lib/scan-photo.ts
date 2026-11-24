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

// Overlap neighboring shelf regions so labels crossing a crop boundary get a second read.
export function* shelfRegions(photo: HTMLCanvasElement) {
  const landscape = photo.width >= photo.height;
  const cols = landscape ? 3 : 2;
  const rows = landscape ? 2 : 3;
  const w = Math.max(1, Math.round(photo.width * (landscape ? 0.375 : 0.625)));
  const h = Math.max(1, Math.round(photo.height * (landscape ? 0.625 : 0.375)));
  const scale = Math.min(2, 1200 / Math.max(w, h));
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const region = document.createElement("canvas");
      region.width = Math.max(1, Math.round(w * scale));
      region.height = Math.max(1, Math.round(h * scale));
      try {
        const ctx = region.getContext("2d");
        if (!ctx) throw new Error("Photo unavailable");
        const x = Math.round(col * (photo.width - w) / (cols - 1));
        const y = Math.round(row * (photo.height - h) / (rows - 1));
        ctx.drawImage(photo, x, y, w, h, 0, 0, region.width, region.height);
        const image = ctx.getImageData(0, 0, region.width, region.height);
        let low = 255, high = 0;
        const pixels = image.data;
        for (let i = 0; i < pixels.length; i += 4) {
          const gray = Math.round(0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]);
          pixels[i] = gray;
          low = Math.min(low, gray);
          high = Math.max(high, gray);
        }
        for (let i = 0; i < pixels.length; i += 4) {
          pixels[i] = pixels[i + 1] = pixels[i + 2] = 255 * (pixels[i] - low) / Math.max(1, high - low);
        }
        ctx.putImageData(image, 0, 0);
        yield region;
      } finally {
        region.width = region.height = 0;
      }
    }
  }
}
