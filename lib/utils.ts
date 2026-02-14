import { Month, Expense, Totals, BackupData, ImportResult } from './types';
import { putMonth, putExpense, getAllMonths, getAllExpenses } from './db';

export const SCHEMA_VERSION = 1;

// ─── UUID ───
export function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Date helpers ───
export function getCurrentYM(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function formatLabel(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function parseLabel(label: string): { year: number; month: number } {
  const [y, m] = label.split('-').map(Number);
  return { year: y, month: m };
}

export function nextMonthLabel(label: string): string {
  const { year, month } = parseLabel(label);
  return month === 12 ? formatLabel(year + 1, 1) : formatLabel(year, month + 1);
}

export function prevMonthLabel(label: string): string {
  const { year, month } = parseLabel(label);
  return month === 1 ? formatLabel(year - 1, 12) : formatLabel(year, month - 1);
}

export function formatCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return '¥' + Number(n).toLocaleString('ja-JP');
}

// ─── Totals ───
export function calculateTotals(expenses: Expense[]): Totals {
  let fixed = 0;
  let variable = 0;
  for (const e of expenses) {
    if (e.isFixed) fixed += e.amount || 0;
    else variable += e.amount || 0;
  }
  return { fixed, variable, grand: fixed + variable };
}

// ─── Reorder ───
export function reorderExpenses(expenses: Expense[]): Expense[] {
  return expenses.map((e, i) => ({ ...e, sortOrder: i }));
}

// ─── Carryover ───
export function createMonthWithCarryover(
  label: string,
  sourceExpenses: Expense[]
): { month: Month; expenses: Expense[] } {
  const monthId = uuid();
  const month: Month = { id: monthId, label, currentAssets: null };
  const sorted = [...sourceExpenses].sort((a, b) => a.sortOrder - b.sortOrder);
  const expenses: Expense[] = sorted.map((e, i) => ({
    id: uuid(),
    monthId,
    label: e.label,
    amount: e.isFixed ? e.amount : 0,
    isFixed: e.isFixed,
    sortOrder: i,
  }));
  return { month, expenses };
}

// ─── Backup ───
export function exportBackup(months: Month[], expenses: Expense[]): BackupData {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    months,
    expenses,
  };
}

export function validateImport(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: '無効なファイル形式です' };
  }
  const d = data as Record<string, unknown>;
  if (d.schemaVersion !== SCHEMA_VERSION) {
    return { valid: false, error: `スキーマバージョンが不一致です（期待値: ${SCHEMA_VERSION}）` };
  }
  if (!Array.isArray(d.months) || !Array.isArray(d.expenses)) {
    return { valid: false, error: '月または支出データが見つかりません' };
  }
  const monthIds = new Set<string>();
  for (const m of d.months as Month[]) {
    if (!m.id || !m.label) return { valid: false, error: '月データに必須フィールドがありません' };
    if (monthIds.has(m.id)) return { valid: false, error: `月IDが重複しています: ${m.id}` };
    monthIds.add(m.id);
  }
  const expIds = new Set<string>();
  for (const e of d.expenses as Expense[]) {
    if (!e.id || !e.monthId || e.label === undefined) {
      return { valid: false, error: '支出データに必須フィールドがありません' };
    }
    if (expIds.has(e.id)) return { valid: false, error: `支出IDが重複しています: ${e.id}` };
    expIds.add(e.id);
  }
  return { valid: true };
}

export async function importBackup(
  data: BackupData,
  localMonths: Month[],
  localExpenses: Expense[]
): Promise<ImportResult> {
  const localMonthIds = new Set(localMonths.map((m) => m.id));
  const localExpenseIds = new Set(localExpenses.map((e) => e.id));
  const importedMonthIds = new Set(data.months.map((m) => m.id));

  let addedMonths = 0, addedExpenses = 0, skippedMonths = 0, skippedExpenses = 0;

  for (const m of data.months) {
    if (localMonthIds.has(m.id)) { skippedMonths++; continue; }
    await putMonth(m);
    addedMonths++;
  }
  for (const e of data.expenses) {
    if (localExpenseIds.has(e.id)) { skippedExpenses++; continue; }
    if (!importedMonthIds.has(e.monthId) && !localMonthIds.has(e.monthId)) {
      skippedExpenses++;
      continue;
    }
    await putExpense(e);
    addedExpenses++;
  }
  return { addedMonths, addedExpenses, skippedMonths, skippedExpenses };
}
