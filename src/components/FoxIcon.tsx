import type { SVGProps } from "react";

type FoxIconProps = SVGProps<SVGSVGElement> & {
  variant: "full" | "simple";
};

export function FoxIcon({ variant, ...props }: FoxIconProps) {
  if (variant === "full") {
    return (
      <svg viewBox="0 0 120 120" fill="none" {...props}>
        <ellipse cx="60" cy="68" rx="38" ry="34" fill="#E8722A" />
        <polygon points="22,50 35,14 50,45" fill="#E8722A" />
        <polygon points="98,50 85,14 70,45" fill="#E8722A" />
        <polygon points="28,47 37,22 48,44" fill="#F5A623" />
        <polygon points="92,47 83,22 72,44" fill="#F5A623" />
        <ellipse cx="60" cy="78" rx="22" ry="18" fill="#FEF3E2" />
        <ellipse cx="45" cy="62" rx="6" ry="7" fill="#1a1a2e" />
        <ellipse cx="75" cy="62" rx="6" ry="7" fill="#1a1a2e" />
        <ellipse cx="46.5" cy="60.5" rx="2.2" ry="2.5" fill="white" />
        <ellipse cx="76.5" cy="60.5" rx="2.2" ry="2.5" fill="white" />
        <ellipse cx="60" cy="74" rx="5" ry="3.5" fill="#1a1a2e" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 120" fill="none" {...props}>
      <ellipse cx="60" cy="68" rx="38" ry="34" fill="#E8722A" />
      <ellipse cx="60" cy="78" rx="22" ry="18" fill="#FEF3E2" />
      <ellipse cx="45" cy="62" rx="6" ry="7" fill="#1a1a2e" />
      <ellipse cx="75" cy="62" rx="6" ry="7" fill="#1a1a2e" />
      <ellipse cx="60" cy="74" rx="5" ry="3.5" fill="#1a1a2e" />
    </svg>
  );
}
