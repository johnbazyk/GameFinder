import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "You" → "Your turn". "Finn" → "Finn's turn". "Jess" → "Jess' turn". */
export function whose(name: string, noun: string) {
  const n = (name || "Someone").trim();
  if (/^you$/i.test(n)) return `Your ${noun}`;
  if (/s$/i.test(n)) return `${n}' ${noun}`;
  return `${n}'s ${noun}`;
}

export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
