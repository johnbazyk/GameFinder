import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";

export function AuthChip() {
  const { isPending } = useCurrentUserState();
  const user = useCurrentUser();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready || isPending) {
    return <div className="h-8 w-20 animate-pulse rounded-full bg-muted" />;
  }
  const letter = (user?.displayName ?? user?.primaryEmail ?? "Y").charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <Link
        to="/circle"
        className="grid size-9 place-items-center rounded-full bg-muted text-foreground"
        aria-label="Tables and friends"
      >
        <Users className="size-4" />
      </Link>
      <SignedOut>
        <Link
          to="/login"
          className="rounded-full bg-fox px-3 py-1.5 text-sm font-semibold text-cream"
        >
          Sign in
        </Link>
      </SignedOut>
      <SignedIn>
        <Link
          to="/profile"
          className="grid size-9 place-items-center overflow-hidden rounded-full bg-fox text-sm font-bold text-cream"
          aria-label="Your account"
        >
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="" className="size-9 object-cover" />
          ) : (
            letter
          )}
        </Link>
      </SignedIn>
    </div>
  );
}
