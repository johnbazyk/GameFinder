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

// Text on a patterned spine can gain a stray letter or lose part of a glyph.
function titleDistance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        row[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + Number(a[i - 1] !== b[j - 1]),
      );
    }
    previous = row;
  }
  return previous[b.length];
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
    // Restrict approximate matches to a whole, distinctive word and a unique
    // catalog candidate. Short labels and edition subtitles still require exact evidence.
    if (line.length >= 7 && !candidates.some(({ key }) => key === line)) {
      const words = line.split(" ");
      const possible = candidates.filter(({ key }) => {
        if (Math.abs(key.length - line.length) > 2) return false;
        if (/^[a-z]{7,}$/.test(key) && words.length === 1 && key.slice(0, 3) === line.slice(0, 3)) {
          // A box border sometimes adds a final stroke to an otherwise legible word.
          const token =
            line.length === key.length + 1 && /[ijl]$/.test(line) ? line.slice(0, -1) : line;
          return titleDistance(key, token) <= 1;
        }
        if (key.length < 12 || words.length < 2) return false;
        const tokens = key.split(" ");
        if (
          tokens.length !== words.length ||
          !tokens.some((t, i) => t.length >= 4 && t === words[i])
        )
          return false;
        const normalized = words
          .map((word, i) =>
            /^\d+$/.test(word) && /^[a-z]+$/.test(tokens[i])
              ? word.replace(/1/g, "t").replace(/0/g, "o")
              : word,
          )
          .join(" ");
        return titleDistance(normalized, key) <= 2;
      });
      if (possible.length === 1) found.add(possible[0].game);
    }
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
