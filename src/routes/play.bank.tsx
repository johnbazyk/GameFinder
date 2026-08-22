import { createFileRoute, Link } from "@tanstack/react-router";
import { FoxAvatar } from "@/components/fox-avatar";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/play/bank")({ component: BankDoor });

function BankDoor() {
  const { isPending } = useCurrentUserState();
  if (isPending) return <div className="h-40 animate-pulse rounded-card bg-muted" />;
  return (
    <div className="mx-auto max-w-sm pb-16 pt-4 text-center">
      <FoxAvatar mood="hopeful" size="lg" />
      <h1 className="mt-3 font-display text-3xl">Bank lives at a table</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Family games only start inside a group, so the +N score stays honest. Winner gets
        one point per person who sat down.
      </p>
      <SignedOut>
        <Button asChild className="mt-6">
          <Link to="/login">Sign in</Link>
        </Button>
      </SignedOut>
      <SignedIn>
        <Button asChild className="mt-6">
          <Link to="/circle">Open a table</Link>
        </Button>
      </SignedIn>
    </div>
  );
}