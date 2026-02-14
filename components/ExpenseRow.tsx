'use client';

import { useState, useEffect, useRef } from 'react';
import { Expense } from '@/lib/types';

interface ExpenseRowProps {
  expense: Expense;
  index: number;
  totalCount: number;
  onUpdate: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onMenuAction: (action: string, fromIndex: number, toIndex?: number) => void;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  isDragOver: boolean;
  onDragOver: (index: number) => void;
}

export default function ExpenseRow({
  expense,
  index,
  totalCount,
  onUpdate,
  onDelete,
  onMenuAction,
  onDragStart,
  onDragEnd,
  isDragOver,
  onDragOver,
}: ExpenseRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [movePos, setMovePos] = useState(false);
  const [posValue, setPosValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setMovePos(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

  const handleMoveToPos = () => {
    const pos = parseInt(posValue, 10);
    if (pos >= 1 && pos <= totalCount) {
      onMenuAction('moveToPosition', index, pos - 1);
      setMovePos(false);
      setMenuOpen(false);
      setPosValue('');
    }
  };

  return (
    <div
      className={`transition-all ${isDragOver ? 'border-t-2 border-sky-400' : 'border-t-2 border-transparent'}`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
    >
      <div className="group flex items-center gap-2 py-3 px-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all mb-2">
        {/* Drag Handle */}
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            onDragStart(index);
          }}
          onDragEnd={onDragEnd}
          className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 touch-none select-none flex-shrink-0 py-1"
          title="ドラッグして並べ替え"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.5" />
            <circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="11" cy="13" r="1.5" />
          </svg>
        </div>

        {/* Label */}
        <input
          type="text"
          value={expense.label}
          onChange={(e) => onUpdate({ ...expense, label: e.target.value })}
          placeholder="項目名"
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-slate-800 placeholder:text-slate-300 font-medium"
        />

        {/* Amount */}
        <div className="flex items-center bg-slate-50 rounded-lg px-2 py-1.5 flex-shrink-0">
          <span className="text-slate-400 text-xs mr-1">¥</span>
          <input
            type="number"
            inputMode="numeric"
            value={expense.amount || ''}
            onChange={(e) =>
              onUpdate({ ...expense, amount: Number(e.target.value) || 0 })
            }
            placeholder="0"
            className="w-20 bg-transparent border-0 outline-none text-sm text-right text-slate-800 font-mono tabular-nums"
          />
        </div>

        {/* Fixed/Variable Toggle */}
        <button
          onClick={() => onUpdate({ ...expense, isFixed: !expense.isFixed })}
          className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
            expense.isFixed
              ? 'bg-sky-100 text-sky-700 hover:bg-sky-200'
              : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
          }`}
        >
          {expense.isFixed ? '固定' : '変動'}
        </button>

        {/* Menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setMovePos(false);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <circle cx="7" cy="2.5" r="1.5" />
              <circle cx="7" cy="7" r="1.5" />
              <circle cx="7" cy="11.5" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 w-48 z-30 animate-scale-in">
              {!movePos ? (
                <>
                  <button
                    onClick={() => {
                      onMenuAction('moveToTop', index);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    先頭へ移動
                  </button>
                  <button
                    onClick={() => {
                      onMenuAction('moveToBottom', index);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    末尾へ移動
                  </button>
                  <button
                    onClick={() => setMovePos(true)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    指定位置へ移動
                  </button>
                  <hr className="my-1 border-slate-100" />
                  <button
                    onClick={() => {
                      onDelete(expense.id);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    削除
                  </button>
                </>
              ) : (
                <div className="px-4 py-3">
                  <p className="text-xs text-slate-500 mb-2">
                    移動先（1〜{totalCount}）
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={totalCount}
                      value={posValue}
                      onChange={(e) => setPosValue(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleMoveToPos();
                      }}
                    />
                    <button
                      onClick={handleMoveToPos}
                      className="px-3 py-1.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
                    >
                      移動
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setMovePos(false);
                      setPosValue('');
                    }}
                    className="mt-2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    キャンセル
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
