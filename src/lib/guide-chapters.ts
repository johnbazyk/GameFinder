import type { Guide } from "./written-guides";

export const chapters = [
  { id: "goal", title: "The goal", field: "goal" },
  { id: "setup", title: "Set the table", field: "setup" },
  { id: "turn", title: "A turn", field: "turn" },
  { id: "score", title: "How you score", field: "win" },
  { id: "oops", title: "Don't mess this up", field: "tip" },
] as const;

type Chapter = (typeof chapters)[number];

export function chapterAudio(guide: Guide, chapter: Chapter) {
  return guide.audio.replace(/\.mp3$/, "/" + chapter.id + ".mp3");
}

const commonWords = new Set(
  "a an the what when where why how can could would should do does did is are my we i it to and or of in for on as with if this that many much me you game have at from any your get happens".split(
    " ",
  ),
);

function terms(text: string) {
  return new Set(
    (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
      .filter((word) => !commonWords.has(word))
      .map((word) => word.replace(/ies$/, "y").replace(/(?<!s)s$/, "")),
  );
}

// Return a labeled passage, never infer a yes/no ruling from a word match.
export function guidePassage(guide: Guide, question: string) {
  const topics = [
    /^(?:(?:what(?:'s| is) (?:the|my) (?:goal|objective))|how (?:do|can) (?:i|we|you) win)\??$/i,
    /^(?:how (?:do|should) (?:i|we|you) (?:set ?up|start)(?: (?:the |this )?game)?|set ?up)\??$/i,
    /^(?:what (?:do (?:i|we|you) do|happens) (?:on|during) (?:my|a|each|your) turn|how (?:do|does) (?:i take|a turn work))\??$/i,
    /^(?:how (?:do (?:i|we|you) score|does scoring work)|how (?:are|do) points (?:scored|work))\??$/i,
    /^(?:what (?:mistakes|should i watch out for)|any tips)\??$/i,
  ];
  const direct = topics.findIndex((pattern) => pattern.test(question.trim()));
  if (direct >= 0) return chapters[direct];
  const words = terms(question);
  if (!words.size) return undefined;
  const sorted = chapters
    .map((chapter) => {
      const passage = terms(guide[chapter.field]);
      const overlap = [...words].filter((word) => passage.has(word)).length;
      return { chapter, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap);
  return sorted[0].overlap > 0 && sorted[0].overlap >= words.size / 2
    ? sorted[0].chapter
    : undefined;
}
