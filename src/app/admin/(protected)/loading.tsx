function Block({className = ''}: {className?: string}) {
  return <div className={`animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.035] ${className}`} />;
}

export default function AdminLoading() {
  return (
    <div aria-label="Loading analytics" role="status">
      <Block className="h-28" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({length: 8}, (_, index) => <Block key={index} className="h-32" />)}
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Block className="h-80" /><Block className="h-80" />
      </div>
    </div>
  );
}
