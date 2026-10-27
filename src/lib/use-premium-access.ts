import { useCallback, useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getPremiumEntitlement } from "@/lib/social";

type AccessState = "loading" | "premium" | "free" | "error";

export function usePremiumAccess() {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id;
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<{ userId: string | null; access: AccessState }>({
    userId: null,
    access: "loading",
  });

  useEffect(() => {
    let current = true;
    if (isPending) {
      setState({ userId: null, access: "loading" });
    } else if (!userId) {
      setState({ userId: null, access: "free" });
    } else {
      setState({ userId, access: "loading" });
      void getPremiumEntitlement()
        .then(({ premium }) => {
          if (current) {
            setState({ userId, access: premium ? "premium" : "free" });
          }
        })
        .catch(() => {
          if (current) setState({ userId, access: "error" });
        });
    }
    return () => {
      current = false;
    };
  }, [isPending, retryCount, userId]);

  const access =
    state.userId === (userId ?? null) && !isPending ? state.access : "loading";
  const retry = useCallback(() => setRetryCount((value) => value + 1), []);
  return { access, retry };
}
