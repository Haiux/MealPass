import { X } from 'lucide-react';

export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 border border-zinc-100">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 rounded-md p-0.5 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
