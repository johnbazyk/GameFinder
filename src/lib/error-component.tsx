import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ reset }: ErrorComponentProps) {
  return (
    <main
      className={
        "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center " +
        "bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"
      }
    >
      <span className="text-red-500" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400">
        GameFinder could not load this page. Try again or return to Find.
      </p>
      <button
        type="button"
        className="min-h-11 rounded-button bg-fox px-5 font-semibold text-cream"
        onClick={reset}
      >
        Try again
      </button>
      <a href="/" className="min-h-11 px-4 py-3 text-sm font-semibold underline">
        Return to Find
      </a>
    </main>
  );
}
