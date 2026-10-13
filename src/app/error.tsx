"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to client console for easy debugging
    console.error("Runtime Server Component Error:", error);
  }, [error]);

  const isDbError =
    error.message?.includes("DATABASE_URL") ||
    error.message?.includes("connect") ||
    error.message?.includes("timeout") ||
    error.digest?.includes("DATABASE");

  return (
    <div className="relative mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="tex-halftone absolute inset-0 opacity-15" />
      <div className="panel grain relative w-full overflow-hidden p-8 sm:p-12">
        <div className="mono mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          <span>Render Disruption {error.digest ? `· #${error.digest}` : ""}</span>
        </div>

        <h1 className="display text-3xl text-paper sm:text-4xl">
          The panel encountered a tear
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-dim">
          A server component encountered an unexpected issue while rendering this archive view.
        </p>

        {isDbError && (
          <div className="mt-6 rounded-lg border border-line bg-black/60 p-4 text-left text-xs">
            <span className="mono block text-[9px] uppercase tracking-wider text-amber-400">
              Database Connection Check
            </span>
            <p className="mt-1.5 text-dim">
              If deploying on Vercel, ensure that <code className="text-paper">DATABASE_URL</code> is added under{" "}
              <strong>Project Settings → Environment Variables</strong> and that your database permits connections.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="mono rounded bg-paper px-6 py-2.5 text-xs font-semibold text-ink transition-opacity hover:opacity-85"
          >
            Reload Panel (Try Again)
          </button>
          <Link
            href="/"
            className="mono rounded border border-line px-6 py-2.5 text-xs text-dim transition-colors hover:border-paper hover:text-paper"
          >
            Back to Archive Home
          </Link>
        </div>
      </div>
    </div>
  );
}
