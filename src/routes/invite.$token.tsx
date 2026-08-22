import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FoxAvatar } from "@/components/fox-avatar";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { acceptInvite, previewInvite, type InvitePreview } from "@/lib/social";

export const Route = createFileRoute("/invite/$token")({ component: InvitePage });

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void previewInvite({ data: { token } })
      .then(setPreview)
      .catch((e) => setErr(e instanceof Error ? e.message : "Invite not found"));
  }, [token]);

  async function accept() {
    setBusy(true);
    try {
      const r = await acceptInvite({ data: { token } });
      toast("You're in.");
      if (r.kind === "group" && "groupId" in r && r.groupId) {
        navigate({ to: "/circle/$groupId", params: { groupId: r.groupId } });
      } else {
        navigate({ to: "/circle" });
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't accept");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm pb-16 pt-6 text-center">
      <FoxAvatar mood="hopeful" size="lg" />
      {err ? (
        <>
          <h1 className="mt-3 font-display text-3xl">That link went cold</h1>
          <p className="mt-2 text-sm text-muted-foreground">{err}</p>
        </>
      ) : !preview ? (
        <p className="mt-4 text-sm text-muted-foreground">Checking the invite…</p>
      ) : preview.expired ? (
        <>
          <h1 className="mt-3 font-display text-3xl">Invite aged out</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ask {preview.fromName} for a fresh link.</p>
        </>
      ) : (
        <>
          <h1 className="mt-3 font-display text-3xl">
            {preview.kind === "group" ? "Pull up a chair" : "A friend request"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {preview.fromName}
            {preview.groupName ? ` invited you to ${preview.groupName}.` : " wants to play."}
          </p>
          {isPending ? (
            <div className="mx-auto mt-6 h-11 w-40 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <Button className="mt-6 w-full" disabled={busy} onClick={() => void accept()}>
              {busy ? "Joining…" : "Accept"}
            </Button>
          ) : (
            <Link
              to="/login"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-fox text-sm font-bold text-cream"
            >
              Sign in to accept
            </Link>
          )}
        </>
      )}
      <p className="mt-8 text-sm">
        <Link to="/" className="font-semibold text-muted-foreground">
          Back to Finn
        </Link>
      </p>
    </div>
  );
}
