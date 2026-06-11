const variants = {
  granted:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
  denied:    'bg-red-50 text-red-700 ring-red-200',
  active:    'bg-emerald-50 text-emerald-700 ring-emerald-200',
  inactive:  'bg-zinc-100 text-zinc-500 ring-zinc-200',
  admin:     'bg-violet-50 text-violet-700 ring-violet-200',
  scanner:   'bg-sky-50 text-sky-700 ring-sky-200',
  breakfast: 'bg-orange-50 text-orange-700 ring-orange-200',
  lunch:     'bg-amber-50 text-amber-700 ring-amber-200',
  dinner:    'bg-indigo-50 text-indigo-700 ring-indigo-200',
};

export default function Badge({ type, label }) {
  const cls = variants[type] || 'bg-zinc-100 text-zinc-600 ring-zinc-200';
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ring-1 ${cls}`}>
      {label || type}
    </span>
  );
}
