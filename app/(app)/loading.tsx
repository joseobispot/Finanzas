export default function Loading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-7 w-52 rounded-lg bg-surface-2" />
      <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-4">
        <div className="h-40 rounded-[18px] bg-surface-2" />
        <div className="h-40 rounded-[18px] bg-surface-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-[18px] bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
