import { FoxIcon } from "./FoxIcon";

export function TopBar() {
  return (
    <header className="topbar">
      <FoxIcon variant="full" width={32} height={32} />
      <span className="topbar-logo">GameFinder</span>
      <span className="topbar-tag">Phase 0</span>
    </header>
  );
}
