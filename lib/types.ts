export interface Month {
  id: string;
  label: string; // "YYYY-MM"
  currentAssets: number | null;
}

export interface Expense {
  id: string;
  monthId: string;
  label: string;
  amount: number;
  isFixed: boolean;
  sortOrder: number;
}

export interface BackupData {
  schemaVersion: number;
  exportedAt: string;
  months: Month[];
  expenses: Expense[];
}

export interface Totals {
  fixed: number;
  variable: number;
  grand: number;
}

export interface ImportResult {
  addedMonths: number;
  addedExpenses: number;
  skippedMonths: number;
  skippedExpenses: number;
}
