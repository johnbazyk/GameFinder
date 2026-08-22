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

/** Put this face on +Y so a top-down camera sees the score. */
const FACE: Record<number, { x: number; y: number; z: number }> = {
  1: { x: 90, y: 0, z: 0 },
  2: { x: 0, y: 0, z: 0 },
  3: { x: 0, y: 0, z: -90 },
  4: { x: 0, y: 0, z: 90 },
  5: { x: 180, y: 0, z: 0 },
  6: { x: -90, y: 0, z: 0 },
};

const FACE_CLASS = [
  "die-face-1",
  "die-face-2",
  "die-face-3",
  "die-face-4",
  "die-face-5",
  "die-face-6",
] as const;

/** dice-box-ish: impulse, bounce, settle. Keep in sync with bank-table THROW_MS. */
export const THROW_MS = 1280;

function pipTone(hex?: string) {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return "#fbf6ef";
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.54 ? "#1c1917" : "#fbf6ef";
}

function pose(x: number, y: number, z = 0) {
  return `rotateX(${x}deg) rotateY(${y}deg) rotateZ(${z}deg)`;
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
  const shadowRef = useRef<HTMLSpanElement>(null);
  const n = value >= 1 && value <= 6 ? value : 1;
  const face = FACE[n];
  const style = ink
    ? ({ "--die-ink": ink, "--die-pip": pipTone(ink) } as CSSProperties)
    : undefined;

  useEffect(() => {
    const wrap = wrapRef.current;
    const cube = cubeRef.current;
    const shadow = shadowRef.current;
    if (!wrap || !cube) return;

    const rest = pose(face.x, face.y, face.z);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (const a of [
      ...wrap.getAnimations(),
      ...cube.getAnimations(),
      ...(shadow?.getAnimations() ?? []),
    ]) {
      a.cancel();
    }

    if (!throwing || reduce) {
      wrap.style.transform = "translate3d(0,0,0) scale(1)";
      cube.style.transform = rest;
      if (shadow) shadow.style.transform = "scale(1)";
      return;
    }

    const aLane = lane === "a";
    const delay = aLane ? 0 : 90;
    const fromX = aLane ? "-52vw" : "-38vw";
    const spinX = aLane ? 1080 : -900;
    const spinY = aLane ? 540 : -720;
    const spinZ = aLane ? 180 : -270;

    wrap.style.transform = `translate3d(${fromX}, 36px, 0) scale(0.92)`;
    cube.style.transform = pose(face.x + spinX, face.y + spinY, face.z + spinZ);

    const slide = wrap.animate(
      [
        { transform: `translate3d(${fromX}, 40px, 0) scale(0.92)`, offset: 0 },
        { transform: `translate3d(${aLane ? "-18vw" : "-12vw"}, -72px, 0) scale(1)`, offset: 0.3 },
        { transform: `translate3d(${aLane ? "6vw" : "8vw"}, 10px, 0) scale(1.08, 0.78)`, offset: 0.5 },
        { transform: `translate3d(${aLane ? "3vw" : "4vw"}, -26px, 0) scale(1)`, offset: 0.66 },
        { transform: "translate3d(1px, 6px, 0) scale(1.05, 0.88)", offset: 0.84 },
        { transform: "translate3d(0, 0, 0) scale(1)", offset: 1 },
      ],
      { duration: THROW_MS, delay, easing: "linear", fill: "forwards" },
    );
    const spin = cube.animate(
      [
        { transform: pose(face.x + spinX, face.y + spinY, face.z + spinZ), offset: 0 },
        { transform: pose(face.x + spinX * 0.45, face.y + spinY * 0.4, face.z + spinZ * 0.5), offset: 0.5 },
        { transform: pose(face.x + 40, face.y + 20, face.z + 12), offset: 0.82 },
        { transform: rest, offset: 1 },
      ],
      { duration: THROW_MS, delay, easing: "cubic-bezier(0.12, 0.7, 0.18, 1)", fill: "forwards" },
    );
    const shade = shadow?.animate(
      [
        { transform: "scale(0.35)", opacity: 0.25, offset: 0 },
        { transform: "scale(0.2)", opacity: 0.15, offset: 0.3 },
        { transform: "scale(1.15)", opacity: 0.55, offset: 0.5 },
        { transform: "scale(0.45)", opacity: 0.25, offset: 0.66 },
        { transform: "scale(1.05)", opacity: 0.5, offset: 0.84 },
        { transform: "scale(1)", opacity: 0.4, offset: 1 },
      ],
      { duration: THROW_MS, delay, easing: "linear", fill: "forwards" },
    );

    return () => {
      slide.cancel();
      spin.cancel();
      shade?.cancel();
    };
  }, [throwing, face.x, face.y, face.z, lane]);

  return (
    <div ref={wrapRef} className="die-throw" style={style}>
      <span ref={shadowRef} className="die-shadow" />
      <div className="die-stage">
        <div ref={cubeRef} className="die-cube" style={{ transform: pose(face.x, face.y, face.z) }}>
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
