// Older boxes can carry a different name for the same base game.
export function boxTitleKey(title: string) {
  const key = title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return /^(the )?settlers of catan$/.test(key) ? "catan" : key;
}
