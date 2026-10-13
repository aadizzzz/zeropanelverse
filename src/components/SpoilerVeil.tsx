"use client";

import { useState, useTransition } from "react";
import type { SpoilerGrade } from "@/db/schema";
import { revealPanelAction } from "@/lib/actions";

/**
 * Renders an entry's headline + body. When the reader's lens hides the entry's
 * spoiler grade the text is withheld by the server and a veil is shown with a
 * per-entry reveal button.
 */
export function SpoilerVeil({
  panelId,
  grade,
  veiled,
  headline,
  body,
  headingTag = "h3",
  headlineClassName,
  bodyClassName,
}: {
  panelId: number;
  grade: SpoilerGrade;
  veiled: boolean;
  headline: string;
  body: string;
  headingTag?: "h2" | "h3";
  headlineClassName: string;
  bodyClassName: string;
}) {
  const [revealed, setRevealed] = useState<{ headline: string; body: string } | null>(null);
  const [pending, start] = useTransition();
  const Heading = headingTag;

  if (!veiled || revealed) {
    const shown = revealed ?? { headline, body };
    return (
      <>
        <Heading className={headlineClassName}>{shown.headline}</Heading>
        <p className={bodyClassName}>{shown.body}</p>
      </>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-3 border border-dashed border-paper/30 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mono text-[9px] text-paper">{grade} spoilers veiled</div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-mute">
          The headline and body are hidden because they contain {grade} spoilers and your lens is
          set to hide them.
        </p>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await revealPanelAction(panelId);
            if (result.ok && result.headline !== undefined && result.body !== undefined) {
              setRevealed({ headline: result.headline, body: result.body });
            }
          })
        }
        className="mono shrink-0 border border-paper/50 px-3 py-2 text-[9px] text-paper transition-colors hover:bg-paper hover:text-ink disabled:opacity-50"
      >
        {pending ? "Revealing…" : "Reveal this one"}
      </button>
    </div>
  );
}
