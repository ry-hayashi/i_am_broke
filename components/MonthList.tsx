'use client';

import { useRef } from 'react';
import { Month, Expense, BackupData } from '@/lib/types';
import { calculateTotals, formatCurrency, validateImport, importBackup } from '@/lib/utils';
import CreateMonthModal from './CreateMonthModal';
import Modal from './Modal';

interface MonthListProps {
  months: Month[];
  expenses: Expense[];
  sortedMonths: Month[];
  backupWarning: boolean;
  lastBackup: string | null;
  createModalOpen: boolean;
  setCreateModalOpen: (v: boolean) => void;
  importModalOpen: boolean;
  setImportModalOpen: (v: boolean) => void;
  defaultCreate: { year: number; month: number };
  onCreateMonth: (year: number, month: number) => void;
  onExport: () => void;
  onImport: (result: { addedMonths: number; addedExpenses: number }) => void;
  onSelectMonth: (id: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
  loadData: () => void;
}

export default function MonthList({
  months,
  expenses,
  sortedMonths,
  backupWarning,
  lastBackup,
  createModalOpen,
  setCreateModalOpen,
  importModalOpen,
  setImportModalOpen,
  defaultCreate,
  onCreateMonth,
  onExport,
  onImport,
  onSelectMonth,
  showToast,
  loadData,
}: MonthListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data: BackupData = JSON.parse(text);
      const validation = validateImport(data);
      if (!validation.valid) {
        showToast(validation.error!, 'error');
        return;
      }
      const result = await importBackup(data, months, expenses);
      loadData();
      onImport(result);
    } catch {
      showToast('インポートに失敗しました', 'error');
    }
    e.target.value = '';
    setImportModalOpen(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-28">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-200/50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">出費管理</h1>
            <p className="text-xs text-slate-400 font-medium">月別の支出と資産を管理</p>
          </div>
        </div>
      </div>

      {/* Backup Warning */}
      {backupWarning && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="mt-0.5 flex-shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <p className="text-amber-800 text-sm font-medium">
              {lastBackup
                ? '最終バックアップから30日以上経過しています'
                : 'バックアップがまだ作成されていません'}
            </p>
            <button
              onClick={onExport}
              className="text-amber-600 text-xs font-medium mt-1 hover:underline"
            >
              今すぐバックアップ →
            </button>
          </div>
        </div>
      )}

      {/* Month Cards */}
      {sortedMonths.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm mb-5">まだ月のデータがありません</p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-7 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-sky-200/50 hover:shadow-xl active:scale-[0.98] transition-all"
          >
            最初の月を追加
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedMonths.map((m) => {
            const mExpenses = expenses.filter((e) => e.monthId === m.id);
            const t = calculateTotals(mExpenses);
            const diff =
              m.currentAssets !== null ? m.currentAssets - t.grand : null;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMonth(m.id)}
                className="w-full text-left p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-slate-800 font-mono tracking-tight">
                      {m.label}
                    </span>
                    <div className="flex gap-4 mt-1.5">
                      <span className="text-xs text-slate-400">
                        支出合計{' '}
                        <span className="font-mono text-slate-600 font-medium">
                          {formatCurrency(t.grand)}
                        </span>
                      </span>
                      {mExpenses.length > 0 && (
                        <span className="text-xs text-slate-300">
                          {mExpenses.length}件
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    {diff !== null && (
                      <span
                        className={`text-sm font-bold font-mono tabular-nums ${
                          diff >= 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {diff >= 0 ? '+' : ''}
                        {formatCurrency(diff)}
                      </span>
                    )}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="2"
                      className="group-hover:translate-x-0.5 transition-transform"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto flex gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex-1 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-sky-200/50 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            月を追加
          </button>
          <button
            onClick={onExport}
            className="py-3.5 px-4 bg-slate-100 text-slate-600 rounded-2xl font-medium text-sm hover:bg-slate-200 active:scale-[0.97] transition-all"
            title="バックアップ"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="py-3.5 px-4 bg-slate-100 text-slate-600 rounded-2xl font-medium text-sm hover:bg-slate-200 active:scale-[0.97] transition-all"
            title="インポート"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modals */}
      <CreateMonthModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={onCreateMonth}
        defaultYear={defaultCreate.year}
        defaultMonth={defaultCreate.month}
        existingLabels={months.map((m) => m.label)}
      />

      <Modal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="データをインポート"
      >
        <p className="text-slate-500 text-sm mb-4 leading-relaxed">
          JSONバックアップファイルを選択してください。既存データはそのまま保持され、新規データのみ追加されます。
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="w-full text-sm file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-sky-50 file:text-sky-700 file:font-medium file:cursor-pointer hover:file:bg-sky-100 transition-all"
        />
      </Modal>
    </div>
  );
}
