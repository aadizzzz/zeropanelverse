"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { watchlistAction } from "@/lib/actions";

const STATUSES = [
  { value: "planned", label: "Plan" },
  { value: "watching", label: "In progress" },
  { value: "finished", label: "Finished" },
];

export function WatchlistControls({
  titleId,
  current,
}: {
  titleId: number;
  current: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set(status: string) {
    setError(null);
    start(async () => {
      const result = await watchlistAction(titleId, status);
      if (!result.ok) setError(result.error ?? "Something went wrong.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((status) => {
          const on = current === status.value;
          return (
            <button
              key={status.value}
              type="button"
              disabled={pending}
              onClick={() => set(status.value)}
              className={`mono border px-3 py-2 text-[10px] transition-colors disabled:opacity-50 ${
                on
                  ? "border-paper bg-paper text-ink"
                  : "border-line text-dim hover:border-paper hover:text-paper"
              }`}
            >
              {status.label}
            </button>
          );
        })}
        {current ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => set("remove")}
            className="mono border border-line px-3 py-2 text-[10px] text-mute hover:border-paper hover:text-paper disabled:opacity-50"
          >
            Remove
          </button>
        ) : null}
      </div>
      {error ? <span className="mono text-[9px] text-paper">{error}</span> : null}
    </div>
  );
}
