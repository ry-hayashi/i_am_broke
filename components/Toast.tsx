'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg =
    type === 'success'
      ? 'bg-emerald-600'
      : type === 'error'
        ? 'bg-red-500'
        : 'bg-amber-500';

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 ${bg} text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-slide-down max-w-xs text-center`}
    >
      {message}
    </div>
  );
}
