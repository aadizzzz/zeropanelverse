"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/library", label: "Library" },
  { href: "/timeline", label: "Timeline" },
  { href: "/panels", label: "Panels" },
  { href: "/messages", label: "Messages" },
  { href: "/streaming", label: "Streaming" },
];

export function NavLinks({ vertical = false }: { vertical?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      className={
        vertical
          ? "flex flex-col gap-1 border-t border-line pt-3"
          : "hidden items-center gap-1 md:flex"
      }
    >
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`mono relative px-3 py-2 text-[10px] transition-colors ${
              active ? "text-ink" : "text-dim hover:text-paper"
            }`}
          >
            {active && <span className="absolute inset-0 bg-paper" />}
            <span className="relative">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
