'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { formatLabel } from '@/lib/utils';

interface CreateMonthModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (year: number, month: number) => void;
  defaultYear: number;
  defaultMonth: number;
  existingLabels: string[];
}

export default function CreateMonthModal({
  open,
  onClose,
  onSubmit,
  defaultYear,
  defaultMonth,
  existingLabels,
}: CreateMonthModalProps) {
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);

  useEffect(() => {
    if (open) {
      setYear(defaultYear);
      setMonth(defaultMonth);
    }
  }, [defaultYear, defaultMonth, open]);

  const label = formatLabel(year, month);
  const isDuplicate = existingLabels.includes(label);
  const years = Array.from({ length: 11 }, (_, i) => defaultYear - 3 + i);

  return (
    <Modal open={open} onClose={onClose} title="月を追加">
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="text-xs text-slate-500 font-medium mb-1 block">年</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300 transition-all"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-500 font-medium mb-1 block">月</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300 transition-all"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
        </div>
      </div>
      <div className="text-center mb-4">
        <span className="text-lg font-bold font-mono text-slate-700">{label}</span>
        {isDuplicate && (
          <p className="text-red-500 text-xs mt-1 font-medium">この月は既に存在します</p>
        )}
      </div>
      <button
        onClick={() => onSubmit(year, month)}
        disabled={isDuplicate}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
          isDuplicate
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-200/50 hover:shadow-xl active:scale-[0.98]'
        }`}
      >
        作成する
      </button>
    </Modal>
  );
}
