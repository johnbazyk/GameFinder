/**
 * Unbiased d6.
 *
 * `n % 6` on a raw 32-bit random is slightly biased: 2^32 is not divisible by 6,
 * so 0–3 show up one extra time in the full range. Rejection sampling discards
 * the overflow tail so every face is equally likely.
 *
 * Source is CSPRNG (`crypto.getRandomValues`), not Math.random().
 */
export function rollD6(): number {
  const buf = new Uint32Array(1);
  // Largest multiple of 6 that fits in uint32.
  const limit = Math.floor(0x100000000 / 6) * 6;
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return (buf[0] % 6) + 1;
  }
}

export function roll2d6(): [number, number] {
  return [rollD6(), rollD6()];
}
