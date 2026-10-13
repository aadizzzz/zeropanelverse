"use client";

import { useEffect, useState } from "react";
import { QuickSearchModal } from "@/components/QuickSearchModal";

export function NavSearchButton({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(typeof navigator !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K or '/' (when not inside an input/textarea)
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" &&
          !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName))
      ) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-2 border border-line bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-dim transition-all hover:border-paper hover:bg-white/[0.07] hover:text-paper"
        title="Search titles, anime, manga, and panelists (Ctrl+K or /)"
      >
        <span className="text-xs text-mute group-hover:text-paper">🔍</span>
        <span className="mono">Search</span>
        <kbd className="mono hidden rounded border border-line bg-white/5 px-1.5 py-0.5 text-[8px] text-mute group-hover:border-paper/40 group-hover:text-paper sm:inline-block">
          {isMac ? "⌘K" : "Ctrl+K"}
        </kbd>
      </button>

      <QuickSearchModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}
