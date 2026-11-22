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

// OCR often reads the designer, title and subtitle as a single line.
export function findBoxTitles<T extends { name: string }>(
  text: string,
  catalog: readonly T[],
): T[] {
  const lines = text
    .split(/[\n|]+/)
    .map(boxTitleKey)
    .filter(Boolean);
  const candidates = catalog
    .map((game) => ({ game, key: boxTitleKey(game.name) }))
    .sort((a, b) => b.key.length - a.key.length);
  const found = new Set<T>();
  function match(line: string) {
    let rest = " " + line.replace(/\b(?:cat an|c atan|c4tan|cat4n)\b/g, "catan") + " ";
    for (const { key, game } of candidates) {
      const phrase = " " + key + " ";
      if (!rest.includes(phrase)) continue;
      // Very short names and ordinary words need a line of their own.
      if (
        (key.length <= 3 || /^(bank|root|heat|hive|scout|coup|clue|life|the mind)$/.test(key)) &&
        line !== key
      )
        continue;
      if (
        key === "catan" &&
        /\b(junior|seafarers|expansion|extension|knights|starfarers|explorers|traders|duel|5 6 player)\b/.test(
          line,
        )
      )
        continue;
      if (/\b(expansion|extension)\b/.test(line) && line !== key) continue;
      found.add(game);
      rest = rest.replace(phrase, " ");
    }
  }
  for (let i = 0; i < lines.length; i++) {
    match(lines[i]);
    if (i && lines[i - 1].length + lines[i].length <= 85) {
      // Only join when the break actually splits a catalog title.
      const combined = lines[i - 1] + " " + lines[i];
      for (const { key, game } of candidates) {
        if (key.includes(" ") && combined === key) found.add(game);
      }
    }
  }
  return [...found];
}
