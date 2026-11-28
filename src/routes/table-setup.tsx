import { createFileRoute, Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PlayersTonight } from "@/components/players-tonight";

export const Route = createFileRoute("/table-setup")({ component: TableSetupPage });

function TableSetupPage() {
  return (
    <div className="pb-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fox">
        Game night setup
      </p>
      <h1 className="font-display text-3xl">Players Tonight</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Remember and select the people joining game night. You can optionally use their count in
        Find a Game; its player filter remains adjustable on its own.
      </p>
      <PlayersTonight />
      <Link
        to="/circle"
        className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-sky"
      >
        <Users className="size-4" />
        Play with family or friends
      </Link>
    </div>
  );
}
