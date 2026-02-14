'use client';

import { useState, useMemo } from 'react';
import { Month, Expense } from '@/lib/types';
import { calculateTotals, formatCurrency, reorderExpenses, uuid } from '@/lib/utils';
import { putExpense, deleteExpense as dbDeleteExpense, putExpensesBatch } from '@/lib/db';
import ExpenseRow from './ExpenseRow';
import ConfirmDialog from './ConfirmDialog';

interface MonthDetailProps {
  month: Month;
  expenses: Expense[];
  sortedMonths: Month[];
  onBack: () => void;
  onNavigate: (monthId: string) => void;
  onCreateNextMonth: () => void;
  onUpdateMonth: (month: Month) => void;
  onExpensesChanged: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
}

export default function MonthDetail({
  month,
  expenses: allExpenses,
  sortedMonths,
  onBack,
  onNavigate,
  onCreateNextMonth,
  onUpdateMonth,
  onExpensesChanged,
  showToast,
}: MonthDetailProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const currentExpenses = useMemo(
    () =>
      allExpenses
        .filter((e) => e.monthId === month.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [allExpenses, month.id]
  );

  const totals = useMemo(() => calculateTotals(currentExpenses), [currentExpenses]);

  // Navigation
  const currentLabel = month.label;
  const prevLabel = sortedMonths.filter((m) => m.label < currentLabel).pop()?.label ?? null;
  const nextLabel = sortedMonths.find((m) => m.label > currentLabel)?.label ?? null;

  const difference =
    month.currentAssets !== null && month.currentAssets !== undefined
      ? month.currentAssets - totals.grand
      : null;

  // ─── Handlers ───

  const handleUpdateExpense = async (updated: Expense) => {
    await putExpense(updated);
    onExpensesChanged();
  };

  const handleAddExpense = async () => {
    const newExp: Expense = {
      id: uuid(),
      monthId: month.id,
      label: '',
      amount: 0,
      isFixed: false,
      sortOrder: currentExpenses.length,
    };
    await putExpense(newExp);
    onExpensesChanged();
  };

  const handleDeleteExpense = async (id: string) => {
    await dbDeleteExpense(id);
    const remaining = currentExpenses
      .filter((e) => e.id !== id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const reordered = reorderExpenses(remaining);
    if (reordered.length > 0) {
      await putExpensesBatch(reordered);
    }
    onExpensesChanged();
    setDeleteConfirm(null);
  };

  const handleMenuAction = async (
    action: string,
    fromIndex: number,
    toIndex?: number
  ) => {
    const items = [...currentExpenses];
    const [item] = items.splice(fromIndex, 1);
    if (action === 'moveToTop') items.unshift(item);
    else if (action === 'moveToBottom') items.push(item);
    else if (action === 'moveToPosition' && toIndex !== undefined)
      items.splice(toIndex, 0, item);
    const reordered = reorderExpenses(items);
    await putExpensesBatch(reordered);
    onExpensesChanged();
  };

  const handleDragEnd = async () => {
    if (
      dragIndex !== null &&
      dragOverIndex !== null &&
      dragIndex !== dragOverIndex
    ) {
      await handleMenuAction('moveToPosition', dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleUpdateAssets = async (value: string) => {
    const updated: Month = {
      ...month,
      currentAssets: value === '' ? null : Number(value) || 0,
    };
    onUpdateMonth(updated);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-8">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm font-medium mb-5 transition-colors active:scale-95"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        一覧へ戻る
      </button>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        {prevLabel ? (
          <button
            onClick={() => {
              const m = sortedMonths.find((x) => x.label === prevLabel);
              if (m) onNavigate(m.id);
            }}
            className="flex items-center gap-1 text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {prevLabel}
          </button>
        ) : (
          <div className="w-20" />
        )}

        <h2 className="text-2xl font-bold text-slate-800 font-mono tracking-tight">
          {currentLabel}
        </h2>

        {nextLabel ? (
          <button
            onClick={() => {
              const m = sortedMonths.find((x) => x.label === nextLabel);
              if (m) onNavigate(m.id);
            }}
            className="flex items-center gap-1 text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors active:scale-95"
          >
            {nextLabel}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onCreateNextMonth}
            className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 text-sm font-semibold transition-colors active:scale-95"
          >
            ＋次月を作成
          </button>
        )}
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm">
          <p className="text-xs text-sky-500 font-semibold mb-1">固定費</p>
          <p className="text-base font-bold font-mono text-slate-800 tabular-nums">
            {formatCurrency(totals.fixed)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm">
          <p className="text-xs text-amber-500 font-semibold mb-1">変動費</p>
          <p className="text-base font-bold font-mono text-slate-800 tabular-nums">
            {formatCurrency(totals.variable)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-3.5 shadow-sm">
          <p className="text-xs text-slate-300 font-semibold mb-1">支出合計</p>
          <p className="text-base font-bold font-mono text-white tabular-nums">
            {formatCurrency(totals.grand)}
          </p>
        </div>
      </div>

      {/* Expense List */}
      <div className="mb-4">
        {currentExpenses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">支出項目がありません</p>
          </div>
        ) : (
          currentExpenses.map((expense, index) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              index={index}
              totalCount={currentExpenses.length}
              onUpdate={handleUpdateExpense}
              onDelete={(id) => setDeleteConfirm(id)}
              onMenuAction={handleMenuAction}
              onDragStart={(i) => setDragIndex(i)}
              onDragEnd={handleDragEnd}
              isDragOver={dragOverIndex === index && dragIndex !== index}
              onDragOver={(i) => setDragOverIndex(i)}
            />
          ))
        )}
      </div>

      {/* Add */}
      <button
        onClick={handleAddExpense}
        className="w-full py-3.5 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-sky-300 hover:text-sky-500 font-medium text-sm transition-all flex items-center justify-center gap-2 mb-8 active:scale-[0.99]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        項目を追加
      </button>

      {/* Assets */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-500 mb-3">現在の資産</h3>
        <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3 mb-4">
          <span className="text-slate-400 text-lg mr-2">¥</span>
          <input
            type="number"
            inputMode="numeric"
            value={month.currentAssets ?? ''}
            onChange={(e) => handleUpdateAssets(e.target.value)}
            placeholder="資産額を入力"
            className="flex-1 bg-transparent border-0 outline-none text-xl font-bold font-mono text-slate-800 tabular-nums"
          />
        </div>
        {difference !== null && (
          <div
            className={`rounded-xl p-4 transition-colors ${
              difference >= 0
                ? 'bg-emerald-50 border border-emerald-100'
                : 'bg-red-50 border border-red-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                {difference >= 0 ? '余剰額' : '不足額'}
              </span>
              <span
                className={`text-xl font-bold font-mono tabular-nums ${
                  difference >= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {difference >= 0 ? '+' : ''}
                {formatCurrency(difference)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2.5 bg-slate-200/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    difference >= 0 ? 'bg-emerald-500' : 'bg-red-400'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      month.currentAssets && month.currentAssets > 0
                        ? (totals.grand / month.currentAssets) * 100
                        : 100
                    )}%`,
                  }}
                />
              </div>
              <span className="text-xs text-slate-400 font-mono tabular-nums w-10 text-right">
                {month.currentAssets && month.currentAssets > 0
                  ? Math.round((totals.grand / month.currentAssets) * 100)
                  : 100}
                %
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDeleteExpense(deleteConfirm)}
        title="項目を削除"
        message="この支出項目を削除してもよろしいですか？この操作は元に戻せません。"
      />
    </div>
  );
}
