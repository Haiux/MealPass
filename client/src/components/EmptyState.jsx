export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="w-8 h-8 text-zinc-300 mb-3" strokeWidth={1.5} />}
      <p className="text-sm font-medium text-zinc-500">{title}</p>
      {description && <p className="text-xs text-zinc-400 mt-1">{description}</p>}
    </div>
  );
}
