import { useEffect, useMemo, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, RefreshCw, Sun, Moon, RotateCcw, ShieldCheck } from 'lucide-react';
import { defaultCategories } from './data/defaultCategories';
import { demoReference, initialTransactions, incomingBatch } from './data/demo';
import { analytics, classifyRows } from './domain/demoAnalytics';
import { filterTransactionsByPeriod, type Period } from './domain/period';
import { MainTabs, type MainTab } from './components/MainTabs';
import { MonthlyBarChart } from './components/MonthlyBarChart';
import { CategoryPieChart } from './components/CategoryPieChart';
import { PortfolioBudget } from './components/PortfolioBudget';
import { initialBudgetPlan } from './domain/budgetAnalytics';
import { PortfolioCards } from './components/PortfolioCards';
import { PortfolioConnections, type SyncSource } from './components/PortfolioConnections';
import { simulateBatch, type SyncReport } from './domain/syncAnalytics';
import { PortfolioInvestments } from './components/PortfolioInvestments';
import { TransactionTable } from './components/TransactionTable';
import type { Transaction } from './types/finance';
const brl=(n:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const panel='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';
const btn='inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600 dark:border-slate-700 dark:hover:bg-slate-800';
const periods: {value:Period,label:string}[]=[{value:'month',label:'Novembro 2026'},{value:'last2months',label:'2 meses'},{value:'quarter',label:'3 meses'},{value:'semester',label:'6 meses'},{value:'all',label:'Todo o histórico'}];
export default function App(){
  const [rows,setRows]=useState(initialTransactions);
  const [hidden,setHidden]=useState<Set<string>>(()=>new Set());
  const [period,setPeriod]=useState<Period>('semester');
  const [tab,setTab]=useState<MainTab>('overview');
  const [dark,setDark]=useState(false);
  const [message,setMessage]=useState('');
  const [resetKey,setResetKey]=useState(0);
  const [reports,setReports]=useState<SyncReport[]>([]);
  const [budgetPlan,setBudgetPlan]=useState(initialBudgetPlan);
  useEffect(()=>{document.documentElement.classList.toggle('dark',dark);return()=>document.documentElement.classList.remove('dark');},[dark]);
  const classified=useMemo(()=>classifyRows(rows,defaultCategories),[rows]);
  const filtered=useMemo(()=>filterTransactionsByPeriod(classified,period,{source:'banking',now:()=>demoReference}),[classified,period]);
  const stats=useMemo(()=>analytics(filtered,defaultCategories),[filtered]);
  const sync=(source:SyncSource='all',fail=false)=>{
    const batch=incomingBatch().filter(r=>source==='all'||r.bankName===source);
    const result=simulateBatch(rows,batch,hidden,reports.length+1,source==='all'?'Todas as fontes':source,fail);
    setRows(result.rows);setReports(prev=>[result.report,...prev]);setMessage(result.report.message);
  };
  const reset=()=>{setRows(initialTransactions());setHidden(new Set());setReports([]);setBudgetPlan(initialBudgetPlan());setPeriod('semester');setResetKey(k=>k+1);setMessage('Demonstração restaurada aos dados originais.');};
  const patch=(id:string,updates:Partial<Transaction>)=>setRows(prev=>prev.map(tx=>tx.id===id?{...tx,...updates}:tx));
  const cards=[{label:'Receitas liquidadas',value:stats.income,Icon:TrendingUp,color:'text-emerald-600'},{label:'Despesas liquidadas',value:stats.expenses,Icon:TrendingDown,color:'text-rose-500'},{label:'Resultado do período',value:stats.balance,Icon:Wallet,color:'text-cyan-600'},{label:'Aportes no período',value:stats.invested,Icon:PiggyBank,color:'text-violet-500'}];
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 text-slate-900 dark:text-slate-100 sm:px-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><div className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Portfolio • Financial analytics</div><h1 className="mt-1 text-3xl font-bold tracking-tight">Finance Tracker</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Análise financeira e automação de transações</p></div>
      <div className="flex flex-wrap gap-2"><button className={btn} onClick={()=>setDark(v=>!v)} aria-label={dark?'Ativar tema claro':'Ativar tema escuro'}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button><button className={btn} onClick={reset}><RotateCcw size={16}/> Restaurar demo</button><button className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700" onClick={()=>sync()}><RefreshCw size={16}/> Simular sincronização</button></div>
    </header>
    <div className="flex items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-100"><ShieldCheck className="shrink-0" size={21}/><div><strong>Modo demonstração • 100% fictício</strong><p>Não há conexão bancária real. Os dados e alterações ficam somente na memória desta página. Referência: 25/11/2026.</p></div></div>
    <p role="status" aria-live="polite" className="text-sm text-cyan-700 dark:text-cyan-300">{message}</p>
    <div className="overflow-x-auto"><MainTabs active={tab} onChange={setTab}/></div>
    <section id={'panel-'+tab} role="tabpanel" aria-labelledby={'tab-'+tab} className="space-y-5">
    {tab==='overview'&&<>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Visão geral</h2><label className="text-sm font-medium">Período <select className="ml-2 rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-900" value={period} onChange={e=>setPeriod(e.target.value as Period)}>{periods.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></label></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({label,value,Icon,color})=><article className={panel} key={label}><Icon size={23} className={color}/><p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums">{brl(value)}</p></article>)}</div>
      <p className="text-xs text-slate-500 dark:text-slate-400">Resultado = receitas menos despesas liquidadas em BRL. Aportes, pagamentos de fatura e transferências próprias confirmadas não contam como consumo.</p>
      <div className="grid gap-4 lg:grid-cols-2"><article className={panel}><h3 className="mb-3 font-semibold">Evolução mensal</h3><MonthlyBarChart data={stats.monthly}/></article><article className={panel}><h3 className="font-semibold">Despesas por categoria</h3>{stats.categories.length?<><CategoryPieChart data={stats.categories}/><div className="grid gap-2 sm:grid-cols-2">{stats.categories.map(c=><div className="flex items-center justify-between gap-2 text-xs" key={c.name}><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{background:c.color}}/>{c.name}</span><span className="tabular-nums">{brl(c.value)}</span></div>)}</div></>:<p className="p-6 text-sm">Sem despesas no período.</p>}</article></div>
      <article className={panel}><h3 className="mb-4 text-lg font-semibold">Transações fictícias</h3><TransactionTable key={resetKey+':'+period} transactions={filtered} categories={defaultCategories} onUpdateCategory={(id,categoryId)=>patch(id,{categoryId,manualCategory:true})} onUpdateTransaction={patch} onDeleteTransaction={id=>{setHidden(prev=>new Set([...prev,id]));setRows(prev=>prev.filter(tx=>tx.id!==id));}}/></article>
    </>}
    {tab==='cards'&&<PortfolioCards key={resetKey}/>}
    {tab==='investments'&&<PortfolioInvestments key={resetKey}/>}
    {tab==='budget'&&<PortfolioBudget key={resetKey} rows={classified} categories={defaultCategories} plan={budgetPlan} onPlanChange={setBudgetPlan}/>}
    {tab==='connections'&&<PortfolioConnections rows={rows} reports={reports} onSync={sync}/>}
    </section>
    <footer className="border-t border-slate-200 py-4 text-xs text-slate-500 dark:border-slate-800">Finance Tracker • Demonstração de automação, análise de dados e desenvolvimento de software.</footer>
  </main>;
}
