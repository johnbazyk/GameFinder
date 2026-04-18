import { GAMES, type GameSlug } from "../lib/games";

interface GamePickerProps {
  activeSlug: GameSlug;
  onSelect: (slug: GameSlug) => void;
}

export function GamePicker({ activeSlug, onSelect }: GamePickerProps) {
  return (
    <nav className="picker" aria-label="Select game">
      {GAMES.map((g) => {
        const active = g.slug === activeSlug;
        return (
          <button
            key={g.slug}
            type="button"
            className={`chip ${active ? "chip-active" : "chip-inactive"}`}
            onClick={() => onSelect(g.slug)}
            aria-pressed={active}
          >
            <span aria-hidden="true" style={{ marginRight: 6 }}>
              {g.emoji}
            </span>
            {g.label}
          </button>
        );
      })}
    </nav>
  );
}
