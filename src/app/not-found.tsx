import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 py-20 text-center">
      <div className="tex-halftone absolute inset-0 opacity-20" />
      <div className="relative">
        <div className="mono text-[9px] text-mute">panel missing</div>
        <h1 className="display mt-4 text-[20vw] leading-[0.8] text-paper sm:text-[10rem]">404</h1>
        <p className="mx-auto mt-6 max-w-md text-[14px] leading-relaxed text-dim">
          This panel was never inked. The title you are looking for may have been renamed, or it is
          still waiting to be filed in the archive.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/library"
            className="mono bg-paper px-5 py-3 text-[10px] text-ink hover:opacity-80"
          >
            Browse the archive
          </Link>
          <Link
            href="/"
            className="mono border border-line px-5 py-3 text-[10px] text-dim hover:border-paper hover:text-paper"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
