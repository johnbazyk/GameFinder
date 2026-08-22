import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FoxAvatar } from "@/components/fox-avatar";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { rememberInvite } from "@/lib/pending-invite";
import { acceptInvite, previewInvite, type InvitePreview } from "@/lib/social";

export const Route = createFileRoute("/invite/$token")({ component: InvitePage });

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const joining = useRef(false);

  useEffect(() => {
    rememberInvite(token);
  }, [token]);

  useEffect(() => {
    void previewInvite({ data: { token } })
      .then(setPreview)
      .catch((e) => setErr(e instanceof Error ? e.message : "Invite not found"));
  }, [token]);

  async function accept() {
    if (joining.current) return;
    joining.current = true;
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
      joining.current = false;
      toast(e instanceof Error ? e.message : "Couldn't accept");
      setErr(e instanceof Error ? e.message : "Couldn't accept");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!user || !preview || preview.expired || err) return;
    void accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot join after auth
  }, [user, preview, err, token]);

  const next = `/invite/${token}`;

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
          {isPending || user || busy ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {user || busy ? "Seating you at the table…" : "One second…"}
            </p>
          ) : (
            <Link
              to="/login"
              search={{ next }}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-fox text-sm font-bold text-cream"
            >
              Create an account to join
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
