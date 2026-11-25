import { chapters, chapterAudio } from "./guide-chapters";
import type { Guide } from "./written-guides";

export const sevenAnswer =
  "Nobody collects resources on a seven. Anyone with eight or more resource cards discards half, rounding down. Move the robber to a different land hex. Choose an opponent who has a settlement or city beside that hex and has resource cards, and take one random resource card from them if you can.";

const recordings = import.meta.glob<string>("../assets/finn-catan-preview/*.mp3", {
  eager: true,
  import: "default",
  query: "?url",
});

function recording(id: string) {
  return recordings["../assets/finn-catan-preview/" + id + ".mp3"];
}

const ready = chapters.every((chapter) => recording(chapter.id)) && Boolean(recording("seven"));

export function lessonRecording(guide: Guide, chapter: (typeof chapters)[number]) {
  if (ready && guide.audio === "/lessons/catan.mp3") return recording(chapter.id);
  return chapterAudio(guide, chapter);
}

export function previewAnswer(gameId: string, question: string) {
  if (!ready || gameId !== "13") return;
  const wording = question
    .toLowerCase()
    .trim()
    .replace(/[.?!]+$/, "");
  if (
    /^what happens (?:on |(?:when|if) (?:i|we|you|someone) roll(?:s)? )(?:a )?(?:7|seven)$/.test(
      wording,
    )
  ) {
    return {
      text: sevenAnswer,
      label: "Catan quick-start answer · Check your edition",
      audio: recording("seven"),
    };
  }
}
