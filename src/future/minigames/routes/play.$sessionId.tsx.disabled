import { whose } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BankTable } from "@/components/minigames/bank-table";
import { CheckersBoard, ChessBoard, Connect4Board, SeatDots, TttBoard } from "@/components/minigames/boards";
import { ShedTable } from "@/components/minigames/shed-table";
import { StockpileTable } from "@/components/minigames/stockpile-table";
import { useMiniSession } from "@/components/minigames/play-table";
import { Button } from "@/components/ui/button";
import { MINI_GAMES } from "@/lib/minigames/types";
import { BANK_BGG_ID } from "@/lib/bank";
import { STOCKPILE_ID } from "@/lib/minigames/stockpile";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

const TEACH_FOR: Partial<Record<string, string>> = {
  bank: BANK_BGG_ID,
  stockpile: STOCKPILE_ID,
};

export const Route = createFileRoute("/play/$sessionId")({ component: PlaySession });

function PlaySession() {
  const { sessionId } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const { view, err, busy, act } = useMiniSession(sessionId);

  if (isPending) return <div className="h-40 animate-pulse rounded-card bg-muted" />;
  if (!user) return <RedirectToSignIn />;
  if (err) {
    return (
      <div className="pb-10">
        <p className="text-sm text-berry">{err}</p>
        <Link to="/circle" className="mt-3 inline-block text-sm font-semibold text-sky">
          Back to tables
        </Link>
      </div>
    );
  }
  if (!view) return <div className="h-40 animate-pulse rounded-card bg-muted" />;

  if (view.gameType === "bank") {
    return <BankTable view={view} busy={busy} act={act} />;
  }
  if (view.gameType === "stockpile") {
    return <StockpileTable view={view} busy={busy} act={act} />;
  }

  const meta = MINI_GAMES[view.gameType];
  const turnName = view.players.find((p) => p.userId === view.currentTurnUserId)?.name;
  const winnerName = view.players.find((p) => p.userId === view.winnerId)?.name;
  const n = view.players.length;

  return (
    <div className="pb-10">
      <Link
        to="/circle/$groupId"
        params={{ groupId: view.groupId }}
        className="text-sm font-semibold text-sky"
      >
        Back to the table
      </Link>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-fox">
        Family game
      </p>
      <h1 className="font-display text-3xl">{meta.label}</h1>
      {TEACH_FOR[view.gameType] ? (
        <Link
          to="/game/$id/table"
          params={{ id: TEACH_FOR[view.gameType]! }}
          className="mt-1 inline-block text-sm font-semibold text-sky"
        >
          Teach me with Finn
        </Link>
      ) : null}
      <SeatDots players={view.players} />
      {view.status === "finished" ? (
        <p className="mt-3 rounded-card bg-fox/10 px-4 py-3 text-sm font-semibold">
          {view.winnerId
            ? `${winnerName} wins. +${view.pointsAwarded ?? n} on the family scoreboard.`
            : "Draw. No family points this time."}
        </p>
      ) : (
        <p className="mt-3 text-sm font-semibold">
          {turnName ? whose(turnName, "turn") : "Waiting"}
          {view.you === view.currentTurnUserId ? " — that's you." : "."}
        </p>
      )}
      {view.lastLine ? <p className="mt-1 text-sm text-muted-foreground">{view.lastLine}</p> : null}

      <div className="mt-6">
        {view.gameType === "tictactoe" ? <TttBoard view={view} busy={busy} act={act} /> : null}
        {view.gameType === "connect4" ? <Connect4Board view={view} busy={busy} act={act} /> : null}
        {view.gameType === "checkers" ? <CheckersBoard view={view} busy={busy} act={act} /> : null}
        {view.gameType === "chess" ? <ChessBoard view={view} busy={busy} act={act} /> : null}
        {view.gameType === "shed" ? <ShedTable view={view} busy={busy} act={act} /> : null}
      </div>

      {view.status === "active" && view.gameType !== "chess" ? (
        <Button className="mt-6" variant="outline" disabled={busy} onClick={() => act({ type: "resign" })}>
          Resign
        </Button>
      ) : null}
    </div>
  );
}
