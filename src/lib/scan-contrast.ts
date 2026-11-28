export type ScanContrastMode = "red" | "detail" | "warm" | "green" | "redInk" | "compactRed";

// Use a single colour channel to separate coloured lettering from similarly bright artwork.
// For embossed or outlined lettering, subtract a local average to highlight the strokes.
export function scanContrast(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  mode: ScanContrastMode,
) {
  if (mode === "redInk" || mode === "compactRed") {
    for (let j = 0; j < pixels.length; j += 4) {
      const red = pixels[j];
      const ink = red - Math.max(pixels[j + 1], pixels[j + 2]) > 18;
      const value = mode === "compactRed" ? red : ink ? 0 : 255;
      pixels[j] = pixels[j + 1] = pixels[j + 2] = value;
    }
    return;
  }
  if (mode === "green") {
    for (let j = 0; j < pixels.length; j += 4) pixels[j] = pixels[j + 2] = pixels[j + 1];
    return;
  }
  if (mode === "warm") {
    // Solid mask for warm-coloured lettering over scenery on a box.
    for (let j = 0; j < pixels.length; j += 4) {
      const value = pixels[j] - pixels[j + 1] > 12 ? 0 : 255;
      pixels[j] = pixels[j + 1] = pixels[j + 2] = value;
    }
    return;
  }
  const gray = new Uint8Array(width * height);
  const stride = width + 1;
  const sums = mode === "detail" ? new Uint32Array(stride * (height + 1)) : null;
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const j = i * 4;
      gray[i] =
        mode === "red"
          ? pixels[j]
          : Math.round(0.299 * pixels[j] + 0.587 * pixels[j + 1] + 0.114 * pixels[j + 2]);
      if (sums) {
        rowSum += gray[i];
        sums[(y + 1) * stride + x + 1] = rowSum + sums[y * stride + x + 1];
      }
    }
  }
  const histogram = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) {
    if (sums) {
      const x = i % width,
        y = Math.floor(i / width);
      const left = Math.max(0, x - 5),
        right = Math.min(width, x + 6);
      const top = Math.max(0, y - 5),
        bottom = Math.min(height, y + 6);
      const sum =
        sums[bottom * stride + right] -
        sums[top * stride + right] -
        sums[bottom * stride + left] +
        sums[top * stride + left];
      gray[i] = Math.max(
        0,
        Math.min(255, gray[i] + 128 - Math.round(sum / ((right - left) * (bottom - top)))),
      );
    }
    histogram[gray[i]]++;
  }
  const trim = gray.length * 0.01;
  let low = 0,
    high = 255,
    below = 0,
    above = 0;
  while (low < high && below + histogram[low] <= trim) below += histogram[low++];
  while (high > low && above + histogram[high] <= trim) above += histogram[high--];
  for (let i = 0; i < gray.length; i++) {
    const value = ((gray[i] - low) * 255) / Math.max(1, high - low);
    pixels[4 * i] = pixels[4 * i + 1] = pixels[4 * i + 2] = value;
  }
}
