import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { Category, Transaction } from '../types/finance';
import { classifyTransaction, isRealExpense, isRealIncome } from '../domain/finance';

const formatBrazilianDate = (value: string) => {
  if (!value) return '';

  const isoValue = value.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoValue)) {
    const [year, month, day] = isoValue.split('-');
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
  onUpdateCategory: (transactionId: string, categoryId: string) => void;
  onUpdateTransaction: (transactionId: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (transactionId: string) => void;
}

const pageSize = 8;

const normalizeDateToISO = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
};

const getTransactionMonthKey = (dateStr: string) => {
  if (!dateStr) return '';

  if (dateStr.includes('/')) {
    const [, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}`;
  }

  if (dateStr.includes('-')) {
    const [year, month] = dateStr.split('-');
    return `${year}-${month.padStart(2, '0')}`;
  }

  return '';
};

const monthNames: Record<string, string> = {
  '01': 'jan',
  '02': 'fev',
  '03': 'mar',
  '04': 'abr',
  '05': 'mai',
  '06': 'jun',
  '07': 'jul',
  '08': 'ago',
  '09': 'set',
  '10': 'out',
  '11': 'nov',
  '12': 'dez',
};

const formatPeriodLabel = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-');
  if (!year || !month) return yearMonth;
  return `${monthNames[month] || month}/${year.slice(2)}`;
};

const sortTransactionsByDateDesc = (items: Transaction[]) =>
  [...items].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return (a.id ?? '').localeCompare(b.id ?? '');
  });

export function TransactionTable({
  transactions,
  categories,
  onUpdateCategory,
  onUpdateTransaction,
  onDeleteTransaction,
}: TransactionTableProps) {
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense' | 'investment'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftDescription, setDraftDescription] = useState('');
  const [sortConfig, setSortConfig] = useState<{ field: 'date'; direction: 'asc' | 'desc' }>({
    field: 'date',
    direction: 'desc',
  });
  const descriptionInputRef = useRef<HTMLInputElement | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);
  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (pendingDelete && dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, [pendingDelete]);

  const bankOptions = useMemo(
    () =>
      Array.from(
        new Set(
          transactions
            .map((transaction) => transaction.bankName ?? transaction.bank ?? 'Outro')
            .filter(Boolean),
        ),
      ).sort(),
    [transactions],
  );

  const monthOptions = useMemo(() => {
    const months = new Map<string, string>();

    transactions.forEach((transaction) => {
      const key = getTransactionMonthKey(transaction.date);
      if (!key) return;
      months.set(key, key);
    });

    return Array.from(months.keys()).sort((left, right) => right.localeCompare(left));
  }, [transactions]);

  const sortedTransactions = useMemo(() => {
    const items = sortTransactionsByDateDesc(transactions.map(tx => classifyTransaction(tx, categories)));
    if (sortConfig.field === 'date' && sortConfig.direction === 'asc') {
      return [...items].reverse();
    }
    return items;
  }, [sortConfig, transactions, categories]);

  const filteredTransactions = useMemo(() => {
    const term = search.trim().toLowerCase();
    const isSpecificMonthSelected = Boolean(selectedMonth && selectedMonth !== 'all');

    const filteredList = sortedTransactions.filter((transaction) => {
      const matchesSearch = !term || transaction.description.toLowerCase().includes(term);
      const matchesBank = selectedBank === 'all' || (transaction.bankName ?? transaction.bank ?? 'Outro') === selectedBank;
      const matchesType = selectedType === 'all' || (selectedType === 'investment' ? transaction.isInvestment : selectedType === 'income' ? isRealIncome(transaction, categories) : isRealExpense(transaction, categories));
      const transactionMonth = getTransactionMonthKey(transaction.date);
      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'uncategorized'
          ? (transaction.categoryId ?? 'uncategorized') === 'uncategorized'
          : transaction.categoryId === selectedCategory);
      const matchesMonth = selectedMonth === 'all' || transactionMonth === selectedMonth;

      return matchesSearch && matchesBank && matchesType && matchesCategory && matchesMonth;
    });

    return [...filteredList].sort((a, b) => {
      const dateA = normalizeDateToISO(a.date);
      const dateB = normalizeDateToISO(b.date);

      if (isSpecificMonthSelected) {
        return dateA.localeCompare(dateB);
      }

      return dateB.localeCompare(dateA);
    });
  }, [search, selectedBank, selectedCategory, selectedMonth, selectedType, sortedTransactions, categories]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));

  const currentPage = Math.min(page, totalPages);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage]);

  const topExpenses = useMemo(
    () =>
      [...transactions]
        .filter((tx) => isRealExpense(tx, categories))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    [transactions, categories],
  );

  const onPageChange = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  };

  const saveDescription = (transactionId: string, nextValue: string) => {
    const cleaned = nextValue.trim();
    if (!cleaned) {
      setEditingId(null);
      setDraftDescription('');
      return;
    }

    onUpdateTransaction(transactionId, { description: cleaned, updatedAt: new Date().toISOString() });
    setEditingId(null);
    setDraftDescription('');
  };

  return (
    <div className="space-y-6">
      {pendingDelete && (
        <dialog ref={deleteDialogRef} onCancel={event=>{event.preventDefault();setPendingDelete(null);}} className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/60 dark:bg-slate-900 dark:text-slate-100" aria-labelledby="delete-transaction-title">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h3 id="delete-transaction-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              Excluir transação?
            </h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p>
                <span className="font-medium text-slate-800 dark:text-slate-100">Data:</span> {formatBrazilianDate(pendingDelete.date)}
              </p>
              <p>
                <span className="font-medium text-slate-800 dark:text-slate-100">Descrição:</span> {pendingDelete.description}
              </p>
              <p>
                <span className="font-medium text-slate-800 dark:text-slate-100">Valor:</span>{' '}
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: pendingDelete.currencyCode || 'BRL' }).format(pendingDelete.amount)}
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                autoFocus onClick={() => setPendingDelete(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTransaction(pendingDelete.id);
                  setPendingDelete(null);
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Excluir
              </button>
            </div>
          </div>
        </dialog>
      )}
      <div className="flex min-w-0 flex-col gap-6">
        <section className="order-2 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <h3 className="shrink-0 text-lg font-semibold text-slate-900 dark:text-white">Transações</h3>
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <select
                aria-label="Filtrar por instituição" value={selectedBank}
                onChange={(event) => {
                  setSelectedBank(event.target.value);
                  setPage(1);
                }}
                className="h-10 max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="all">Todos os bancos</option>
                {bankOptions.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filtrar por tipo" value={selectedType}
                onChange={(event) => {
                  setSelectedType(event.target.value as 'all' | 'income' | 'expense' | 'investment');
                  setPage(1);
                }}
                className="h-10 max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="all">Todos os tipos</option>
                <option value="income">Entradas</option>
                <option value="expense">Saídas</option>
                <option value="investment">Investimentos</option>
              </select>

              <select
                aria-label="Filtrar por categoria" value={selectedCategory}
                onChange={(event) => {
                  setSelectedCategory(event.target.value);
                  setPage(1);
                }}
                className="h-10 max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="all">Todas as categorias</option>
                <option value="uncategorized">Sem categoria</option>
                {categories.filter(category=>category.id!=='uncategorized').map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filtrar por mês" value={selectedMonth}
                onChange={(event) => {
                  setSelectedMonth(event.target.value);
                  setPage(1);
                }}
                className="h-10 max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="all">Todos os períodos</option>
                {monthOptions.map((monthKey) => (
                  <option key={monthKey} value={monthKey}>
                    {formatPeriodLabel(monthKey)}
                  </option>
                ))}
              </select>

              <input
                aria-label="Buscar por descrição" value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por descrição"
                className="h-10 w-full max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-cyan-400 sm:w-64 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950/70">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Data</th>
                    <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Descrição</th>
                    <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Categoria</th>
                    <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Valor</th>
                    <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {paginatedTransactions.length ? (
                    paginatedTransactions.map((transaction) => {
                      const category = categories.find((item) => item.id === transaction.categoryId) ?? categories[0];
                      const isNeutral = Boolean(transaction.isNeutral);
                      const bankStyles: Record<string, string> = {
                        Inter: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/60 dark:text-orange-300',
                        Caixa: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300',
                        BB: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-300',
                        Sofisa: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300',
                        Outro: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
                      };

                      return (
                        <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/70">
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatBrazilianDate(transaction.date)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              {editingId === transaction.id ? (
                                <input
                                  ref={descriptionInputRef}
                                  aria-label="Editar descrição"
                                  autoFocus
                                  value={draftDescription}
                                  onChange={(event) => setDraftDescription(event.target.value)}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                      event.preventDefault();
                                      saveDescription(transaction.id, draftDescription);
                                    }
                                    if (event.key === 'Escape') {
                                      event.preventDefault();
                                      setEditingId(null);
                                      setDraftDescription('');
                                    }
                                  }}
                                  onBlur={() => saveDescription(transaction.id, draftDescription)}
                                  className="w-full rounded-lg border border-cyan-400 bg-white px-2 py-1 text-sm text-slate-800 outline-none dark:bg-slate-950 dark:text-slate-100"
                                />
                              ) : (
                                <button type="button"
                                  title="Editar descrição"
                                  aria-label={`Editar descrição: ${transaction.description}`}
                                  className="break-words text-left font-medium text-slate-800 underline decoration-dotted underline-offset-2 dark:text-slate-100"
                                  onClick={() => {
                                    setEditingId(transaction.id);
                                    setDraftDescription(transaction.description);
                                  }}
                                >
                                  {transaction.description}
                                  {transaction.providerStatus === 'PENDING' && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">Pendente</span>}
                                </button>
                              )}
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-slate-500 dark:text-slate-400">{transaction.isInvestment ? 'Investimento · fora dos gastos' : transaction.type === 'income' ? 'Entrada' : 'Saída'}</span>
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${bankStyles[transaction.bankName ?? transaction.bank ?? 'Outro'] ?? bankStyles.Outro}`}
                                >
                                  {transaction.bankName ?? transaction.bank ?? 'Outro'}
                                </span>
                                {transaction.isCreditCardPayment && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    Fatura Paga (Neutro)
                                  </span>
                                )}
                                {isNeutral && !transaction.isCreditCardPayment && !transaction.isInvestment && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/60 dark:text-violet-300">
                                    ⇄ Transferência / Neutro
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <button type="button" className="text-cyan-700 underline dark:text-cyan-300" onClick={() => { const notes=window.prompt('Anotação desta movimentação (até 2000 caracteres)',transaction.notes??'');if(notes===null)return;if(notes.length>2000){window.alert('A anotação deve ter no máximo 2.000 caracteres.');return;}onUpdateTransaction(transaction.id,{notes}); }}>{transaction.notes?'Editar anotação':'Anotar'}</button>
                                {transaction.source==='pluggy'&&<label className="flex items-center gap-1"><input type="checkbox" checked={Boolean(transaction.isSelfTransfer)} onChange={event=>onUpdateTransaction(transaction.id,{isSelfTransfer:event.target.checked})}/>Transferência própria</label>}
                              </div>
                              {transaction.notes&&<p className="mt-1 max-w-sm whitespace-pre-wrap text-xs text-slate-500">{transaction.notes}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              aria-label={`Categoria de ${transaction.description}`} value={transaction.categoryId}
                              onChange={(event) => onUpdateCategory(transaction.id, event.target.value)}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                            >
                              {categories.map((categoryOption) => (
                                <option key={categoryOption.id} value={categoryOption.id}>
                                  {categoryOption.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: category?.color ?? '#94a3b8' }}
                              />
                              <span
                                className={`font-semibold ${
                                  transaction.isInvestment ? 'text-cyan-700 dark:text-cyan-300' : transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {transaction.type === 'income' ? '+' : '-'}
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: transaction.currencyCode || 'BRL',
                                }).format(transaction.amount)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              title="Excluir transação"
                              onClick={() => setPendingDelete(transaction)}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                              aria-label={`Excluir transação ${transaction.description}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                        Nenhuma transação encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              Anterior
            </button>

            <span className="text-sm text-slate-600 dark:text-slate-300">
              Página {currentPage} de {totalPages}
            </span>

            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              Próxima
            </button>
          </div>
        </section>

        <aside className="order-1 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Top 5 maiores gastos do período</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {topExpenses.length ? (
              topExpenses.map((transaction, index) => {
                const category = categories.find((item) => item.id === transaction.categoryId);

                return (
                  <div key={transaction.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        #{index + 1}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{formatBrazilianDate(transaction.date)}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 break-words">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{transaction.description}</p>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{category?.name ?? 'Sem categoria'}</span>
                      </div>
                      <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                        -
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: transaction.currencyCode || 'BRL',
                        }).format(transaction.amount)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Ainda não há gastos para mostrar.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
