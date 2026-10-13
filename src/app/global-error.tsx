"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0c0c0c] text-[#f0f0f0] flex items-center justify-center p-6 antialiased font-sans">
        <div className="max-w-md w-full border border-[#262626] bg-[#141414] p-8 text-center rounded-xl shadow-2xl">
          <div className="text-3xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Archive Connection Interrupted</h2>
          <p className="text-sm text-[#888] mb-6 leading-relaxed">
            The root layout failed to initialize. If you recently deployed to Vercel, please confirm that your{" "}
            <code className="text-[#eee] bg-black/50 px-1 py-0.5 rounded">DATABASE_URL</code> environment variable is set.
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="bg-[#f0f0f0] text-black px-5 py-2 text-xs font-semibold rounded hover:opacity-85"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="border border-[#333] px-5 py-2 text-xs text-[#aaa] rounded hover:text-white hover:border-[#666]"
            >
              Refresh
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
