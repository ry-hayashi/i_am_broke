import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Month, Expense } from './types';

interface ExpenseDB extends DBSchema {
  months: {
    key: string;
    value: Month;
  };
  expenses: {
    key: string;
    value: Expense;
    indexes: { 'monthId': string };
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

const DB_NAME = 'expense_manager_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ExpenseDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ExpenseDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ExpenseDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('months')) {
          db.createObjectStore('months', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('expenses')) {
          const store = db.createObjectStore('expenses', { keyPath: 'id' });
          store.createIndex('monthId', 'monthId', { unique: false });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// ─── Months ───
export async function getAllMonths(): Promise<Month[]> {
  const db = await getDB();
  return db.getAll('months');
}

export async function putMonth(month: Month): Promise<void> {
  const db = await getDB();
  await db.put('months', month);
}

// ─── Expenses ───
export async function getAllExpenses(): Promise<Expense[]> {
  const db = await getDB();
  return db.getAll('expenses');
}

export async function getExpensesByMonth(monthId: string): Promise<Expense[]> {
  const db = await getDB();
  return db.getAllFromIndex('expenses', 'monthId', monthId);
}

export async function putExpense(expense: Expense): Promise<void> {
  const db = await getDB();
  await db.put('expenses', expense);
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('expenses', id);
}

export async function putExpensesBatch(expenses: Expense[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('expenses', 'readwrite');
  await Promise.all([
    ...expenses.map((e) => tx.store.put(e)),
    tx.done,
  ]);
}

// ─── Meta ───
export async function getMeta(key: string): Promise<string | null> {
  const db = await getDB();
  const result = await db.get('meta', key);
  return result?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.put('meta', { key, value });
}
