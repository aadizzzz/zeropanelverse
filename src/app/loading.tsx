export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mono flex items-center gap-3 text-[9px] text-mute">
        <span className="h-2 w-2 bg-paper pulse-line" />
        inking panels…
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="panel grain flex flex-col gap-4 p-3">
            <div className="aspect-[3/4] w-full bg-ink-raise" />
            <div className="h-2 w-2/3 bg-line" />
            <div className="h-2 w-1/2 bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
