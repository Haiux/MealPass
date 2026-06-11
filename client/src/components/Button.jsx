const base = 'inline-flex items-center gap-1.5 font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed';

const variants = {
  primary:   'bg-zinc-900 text-white hover:bg-zinc-700 focus-visible:ring-zinc-900',
  secondary: 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 focus-visible:ring-zinc-400',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
  ghost:     'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 focus-visible:ring-zinc-400',
};

const sizes = {
  sm: 'text-xs px-2.5 py-1.5',
  md: 'text-sm px-3 py-1.5',
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
