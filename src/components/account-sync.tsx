import { useEffect, useRef } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getCloudVault, replaceCloudVault } from "@/lib/social";
import { useAppStore } from "@/lib/store";

/** Merge the device vault with the signed-in cloud shelf. Guests are untouched. */
export function AccountSync() {
  const { user, isPending } = useCurrentUserState();
  const mergedFor = useRef<string | null>(null);

  useEffect(() => {
    if (isPending || !user) {
      mergedFor.current = null;
      return;
    }
    if (mergedFor.current === user.id) return;
    mergedFor.current = user.id;
    const local = useAppStore.getState();
    void getCloudVault()
      .then((cloud) => {
        const owned = Array.from(new Set([...cloud.owned, ...local.owned]));
        const wishlist = Array.from(new Set([...cloud.wishlist, ...local.wishlist])).filter(
          (id) => !owned.includes(id),
        );
        useAppStore.setState({ owned, wishlist });
        return replaceCloudVault({ data: { owned, wishlist } });
      })
      .catch(() => {
        mergedFor.current = null;
      });
  }, [user, isPending]);

  useEffect(() => {
    if (!user) return;
    let t: number | null = null;
    const unsub = useAppStore.subscribe((state, prev) => {
      if (state.owned === prev.owned && state.wishlist === prev.wishlist) return;
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => {
        void replaceCloudVault({
          data: { owned: state.owned, wishlist: state.wishlist },
        }).catch(() => undefined);
      }, 900);
    });
    return () => {
      unsub();
      if (t) window.clearTimeout(t);
    };
  }, [user]);

  return null;
}
