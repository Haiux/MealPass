const variants = {
  granted: 'bg-green-100 text-green-700',
  denied: 'bg-red-100 text-red-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  admin: 'bg-purple-100 text-purple-700',
  scanner: 'bg-blue-100 text-blue-700',
  breakfast: 'bg-orange-100 text-orange-700',
  lunch: 'bg-yellow-100 text-yellow-700',
  dinner: 'bg-indigo-100 text-indigo-700',
};

export default function Badge({ type, label }) {
  const cls = variants[type] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {label || type}
    </span>
  );
}
