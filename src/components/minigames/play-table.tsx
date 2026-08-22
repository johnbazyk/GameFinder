import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getMiniSession,
  playMiniAction,
  type SessionView,
} from "@/lib/minigames/server";
import type { MiniAction } from "@/lib/minigames/types";
import { MINI_GAMES } from "@/lib/minigames/types";

export function useMiniSession(sessionId: string) {
  const [view, setView] = useState<SessionView | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const v = await getMiniSession({ data: { sessionId } });
    setView((prev) => {
      if (prev && v.version < prev.version) return prev;
      return v;
    });
  }, [sessionId]);

  useEffect(() => {
    void reload().catch((e) => setErr(e instanceof Error ? e.message : "Couldn't load"));
    const t = window.setInterval(() => {
      void reload().catch(() => undefined);
    }, 1600);
    return () => window.clearInterval(t);
  }, [reload]);

  async function act(action: MiniAction) {
    if (!view || busy) return;
    setBusy(true);
    try {
      await playMiniAction({ data: { sessionId, version: view.version, action } });
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't move");
      await reload().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  return { view, err, busy, act, reload, meta: view ? MINI_GAMES[view.gameType] : null };
}
