import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

const PIPS: Record<number, [number, number][]> = {
  1: [[2, 2]],
  2: [
    [1, 1],
    [3, 3],
  ],
  3: [
    [1, 1],
    [2, 2],
    [3, 3],
  ],
  4: [
    [1, 1],
    [1, 3],
    [3, 1],
    [3, 3],
  ],
  5: [
    [1, 1],
    [1, 3],
    [2, 2],
    [3, 1],
    [3, 3],
  ],
  6: [
    [1, 1],
    [1, 2],
    [1, 3],
    [3, 1],
    [3, 2],
    [3, 3],
  ],
};

/** Bring this face to the camera. Same map as GitSquared/diceroll. */
const FACE: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};

const FACE_CLASS = [
  "die-face-1",
  "die-face-2",
  "die-face-3",
  "die-face-4",
  "die-face-5",
  "die-face-6",
] as const;

const THROW_MS = 1000;
const EASE_SLIDE = "cubic-bezier(0.4, 0.02, 0.18, 1)";
const EASE_SPIN = "cubic-bezier(0.2, 0.8, 0.2, 1)";

function pipTone(hex?: string) {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return "#fbf6ef";
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.54 ? "#1c1917" : "#fbf6ef";
}

function pose(x: number, y: number) {
  return `rotateX(${x}deg) rotateY(${y}deg)`;
}

function Face({ n }: { n: number }) {
  return (
    <div className={cn("die-face", FACE_CLASS[n - 1])} aria-hidden>
      {PIPS[n].map(([c, r], i) => (
        <span key={i} className="die-pip" style={{ gridColumn: c, gridRow: r }} />
      ))}
    </div>
  );
}

export function CubeDie({
  value,
  throwing,
  lane = "a",
  ink,
}: {
  value: number;
  throwing: boolean;
  lane?: "a" | "b";
  ink?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const n = value >= 1 && value <= 6 ? value : 1;
  const face = FACE[n];
  const style = ink
    ? ({ "--die-ink": ink, "--die-pip": pipTone(ink) } as CSSProperties)
    : undefined;

  useEffect(() => {
    const wrap = wrapRef.current;
    const cube = cubeRef.current;
    if (!wrap || !cube) return;

    const rest = pose(face.x, face.y);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (const a of [...wrap.getAnimations(), ...cube.getAnimations()]) a.cancel();

    if (!throwing || reduce) {
      wrap.style.transform = "";
      cube.style.transform = rest;
      return;
    }

    const extraX = lane === "a" ? 720 : -640;
    const extraY = lane === "a" ? 360 : -400;
    const delay = lane === "b" ? 110 : 0;
    const fromX = lane === "a" ? "-48vw" : "-40vw";
    const fromY = lane === "a" ? "12px" : "52px";
    const midX = lane === "a" ? "-18vw" : "-14vw";
    const midY = lane === "a" ? "-48px" : "-22px";

    wrap.style.transform = `translate3d(${fromX}, ${fromY}, 0)`;
    cube.style.transform = pose(face.x + extraX, face.y + extraY);

    const slide = wrap.animate(
      [
        { transform: `translate3d(${fromX}, ${fromY}, 0)` },
        { transform: `translate3d(${midX}, ${midY}, 0)`, offset: 0.5 },
        { transform: "translate3d(0, 0, 0)" },
      ],
      { duration: THROW_MS, delay, easing: EASE_SLIDE, fill: "forwards" },
    );
    const spin = cube.animate(
      [{ transform: pose(face.x + extraX, face.y + extraY) }, { transform: rest }],
      { duration: THROW_MS, delay, easing: EASE_SPIN, fill: "forwards" },
    );

    return () => {
      slide.cancel();
      spin.cancel();
    };
  }, [throwing, face.x, face.y, lane]);

  return (
    <div ref={wrapRef} className="die-throw" style={style}>
      <span className="die-shadow" />
      <div className="die-stage">
        <div ref={cubeRef} className="die-cube" style={{ transform: pose(face.x, face.y) }}>
          <Face n={1} />
          <Face n={2} />
          <Face n={3} />
          <Face n={4} />
          <Face n={5} />
          <Face n={6} />
        </div>
      </div>
    </div>
  );
}

export function DicePair({
  values,
  throwing,
  ink,
}: {
  values: [number, number];
  throwing: boolean;
  ink?: string;
}) {
  return (
    <div className="dice-run">
      <CubeDie value={values[0]} throwing={throwing} lane="a" ink={ink} />
      <CubeDie value={values[1]} throwing={throwing} lane="b" ink={ink} />
    </div>
  );
}

export function Die({
  value,
  spinning,
  ink,
}: {
  value: number;
  spinning: boolean;
  size?: "md" | "lg";
  ink?: string;
}) {
  return <CubeDie value={value} throwing={spinning} lane="a" ink={ink} />;
}
