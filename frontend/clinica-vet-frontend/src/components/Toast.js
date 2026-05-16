import { useEffect } from 'react';

/**
 * Toast notification component.
 * Props:
 *   message  – string to display
 *   type     – 'success' | 'error'
 *   onClose  – callback to clear the toast
 *   duration – ms before auto-close (default 3000)
 */
export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  const base =
    'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in';
  const colors = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`${base} ${colors}`}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}
