'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Month, Expense } from '@/lib/types';
import {
  getAllMonths,
  getAllExpenses,
  putMonth,
  putExpense,
  getMeta,
  setMeta,
} from '@/lib/db';
import {
  getCurrentYM,
  formatLabel,
  nextMonthLabel,
  parseLabel,
  createMonthWithCarryover,
  exportBackup,
} from '@/lib/utils';
import MonthList from '@/components/MonthList';
import MonthDetail from '@/components/MonthDetail';
import Toast from '@/components/Toast';

type ToastData = { message: string; type: 'success' | 'error' | 'warning' };

export default function Home() {
  const [months, setMonths] = useState<Month[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [screen, setScreen] = useState<'list' | 'detail'>('list');
  const [currentMonthId, setCurrentMonthId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // ─── Load ───
  const loadData = useCallback(async () => {
    try {
      const [m, e] = await Promise.all([getAllMonths(), getAllExpenses()]);
      setMonths(m);
      setExpenses(e);
      const lb = await getMeta('lastBackup');
      setLastBackup(lb);
    } catch (err) {
      console.error('DB load error:', err);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
      setToast({ message, type });
    },
    []
  );

  // ─── Derived ───
  const sortedMonths = useMemo(
    () => [...months].sort((a, b) => a.label.localeCompare(b.label)),
    [months]
  );

  const currentMonth = months.find((m) => m.id === currentMonthId) ?? null;

  const defaultCreate = useMemo(() => {
    if (sortedMonths.length === 0) return getCurrentYM();
    const latest = sortedMonths[sortedMonths.length - 1].label;
    const next = nextMonthLabel(latest);
    return parseLabel(next);
  }, [sortedMonths]);

  const backupWarning = useMemo(() => {
    if (months.length === 0) return false;
    if (!lastBackup) return true;
    return Date.now() - new Date(lastBackup).getTime() > 30 * 24 * 60 * 60 * 1000;
  }, [lastBackup, months]);

  // ─── Actions ───
  const handleCreateMonth = async (year: number, month: number) => {
    const label = formatLabel(year, month);
    if (months.find((m) => m.label === label)) {
      showToast('この月は既に存在します', 'error');
      return;
    }
    const latestMonth =
      sortedMonths.length > 0 ? sortedMonths[sortedMonths.length - 1] : null;
    const sourceExpenses = latestMonth
      ? expenses
          .filter((e) => e.monthId === latestMonth.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
      : [];
    const { month: newMonth, expenses: newExpenses } =
      createMonthWithCarryover(label, sourceExpenses);
    await putMonth(newMonth);
    for (const e of newExpenses) await putExpense(e);
    await loadData();
    setCurrentMonthId(newMonth.id);
    setScreen('detail');
    setCreateModalOpen(false);
    showToast(`${label} を作成しました`);
  };

  const handleCreateNextMonth = async () => {
    if (!currentMonth) return;
    const next = nextMonthLabel(currentMonth.label);
    const { year, month } = parseLabel(next);
    await handleCreateMonth(year, month);
  };

  const handleExport = async () => {
    const data = exportBackup(months, expenses);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const now = new Date().toISOString();
    await setMeta('lastBackup', now);
    setLastBackup(now);
    showToast('バックアップを保存しました');
  };

  const handleUpdateMonth = async (updated: Month) => {
    await putMonth(updated);
    setMonths((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  // ─── Loading ───
  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 animate-pulse" />
          <span className="text-slate-400 text-sm">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {screen === 'list' ? (
        <MonthList
          months={months}
          expenses={expenses}
          sortedMonths={sortedMonths}
          backupWarning={backupWarning}
          lastBackup={lastBackup}
          createModalOpen={createModalOpen}
          setCreateModalOpen={setCreateModalOpen}
          importModalOpen={importModalOpen}
          setImportModalOpen={setImportModalOpen}
          defaultCreate={defaultCreate}
          onCreateMonth={handleCreateMonth}
          onExport={handleExport}
          onImport={(result) => {
            showToast(
              `インポート完了: 月 ${result.addedMonths}件追加, 支出 ${result.addedExpenses}件追加`
            );
          }}
          onSelectMonth={(id) => {
            setCurrentMonthId(id);
            setScreen('detail');
          }}
          showToast={showToast}
          loadData={loadData}
        />
      ) : currentMonth ? (
        <MonthDetail
          month={currentMonth}
          expenses={expenses}
          sortedMonths={sortedMonths}
          onBack={() => setScreen('list')}
          onNavigate={(id) => setCurrentMonthId(id)}
          onCreateNextMonth={handleCreateNextMonth}
          onUpdateMonth={handleUpdateMonth}
          onExpensesChanged={loadData}
          showToast={showToast}
        />
      ) : null}
    </div>
  );
}
