export function RecordedLesson({ name, src }: { name: string; src: string }) {
  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-semibold">Listen to the guide</figcaption>
      <audio
        key={src}
        controls
        preload="metadata"
        src={src}
        aria-label={`How to play ${name}`}
        className="w-full"
      />
    </figure>
  );
}
