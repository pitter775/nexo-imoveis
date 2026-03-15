export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/50 bg-white/90 p-8 shadow-xl shadow-slate-900/5 backdrop-blur">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
        Em breve
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}
