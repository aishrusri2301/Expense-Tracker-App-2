"use client";

import { useMemo, useState } from "react";
import { Dashboard } from "../components/Dashboard";
import { sampleSms, sampleTransactions } from "../lib/sample-data";
import type { Category, ParseResponse, Transaction } from "../lib/types";

export default function Home() {
  const [smsInput, setSmsInput] = useState(sampleSms);
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions);
  const [preview, setPreview] = useState<Transaction[]>(sampleTransactions);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; text: string }>({ type: "info", text: "Try the sample bank SMS messages or paste your own. The app works even without API keys." });
  const [isParsing, setIsParsing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const totalPreview = useMemo(() => preview.reduce((sum, item) => sum + item.amount, 0), [preview]);

  async function parseTransactions() {
    setIsParsing(true);
    setStatus({ type: "info", text: "Parsing messages and filtering OTPs, balance alerts, failed transactions, and promotions..." });

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sms: smsInput }),
      });
      const data = (await response.json()) as ParseResponse & { error?: string };

      if (!response.ok) throw new Error(data.error ?? "Parsing failed.");
      if (data.transactions.length === 0) {
        setPreview([]);
        setStatus({ type: "error", text: "No spend transactions found. Check that your SMS includes an amount and a debit/spent/paid phrase." });
        return;
      }

      setPreview(data.transactions);
      setTransactions((current) => mergeTransactions(data.transactions, current));
      setStatus({ type: "success", text: data.message });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Something went wrong while parsing." });
    } finally {
      setIsParsing(false);
    }
  }

  function updateCategory(id: string, category: Category) {
    const updater = (items: Transaction[]) => items.map((item) => (item.id === id ? { ...item, category } : item));
    setTransactions(updater);
    setPreview(updater);
  }

  function exportCsv() {
    const headers = ["id", "merchant", "amount", "category", "transaction_date", "transaction_type", "raw_sms"];
    const rows = transactions.map((transaction) => headers.map((header) => csvEscape(String(transaction[header as keyof Transaction]))).join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sms-expense-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-transparent transition-colors dark:bg-slate-950/70">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.35em] text-pink-500">SMS SpendSense</p>
            <h1 className="text-2xl font-black sm:text-3xl">AI expense tracker</h1>
          </div>
          <button onClick={() => setDarkMode((value) => !value)} className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </header>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-6 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div className="glass-card p-5 sm:p-8">
            <div className="mb-5 inline-flex rounded-full bg-pink-100 px-4 py-2 text-sm font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-100">Main workflow: paste → parse → review → dashboard</div>
            <h2 className="text-4xl font-black tracking-tight sm:text-6xl">Paste Bank SMS</h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">Copy one or more bank SMS messages below. The parser extracts merchant, amount, date, type, and category, saves when Supabase is configured, and updates every chart immediately.</p>

            <label htmlFor="sms" className="mt-7 block text-sm font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">Bank SMS input</label>
            <textarea
              id="sms"
              value={smsInput}
              onChange={(event) => setSmsInput(event.target.value)}
              rows={10}
              className="mt-2 w-full rounded-[1.5rem] border border-pink-100 bg-white/90 p-5 text-base shadow-inner outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100 dark:border-white/10 dark:bg-slate-950/70 dark:focus:ring-pink-500/20"
              placeholder="HDFC Bank: Rs 450 spent at DMART using Debit Card"
            />

            <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
              {["HDFC Bank: Rs 450 spent at DMART using Debit Card", "ICICI Bank: INR 630 debited at Zomato on 02-May-2026", "Axis Bank: Rs 280 spent on UBER TRIP"].map((example) => (
                <button key={example} onClick={() => setSmsInput((current) => `${current.trim()}\n\n${example}`.trim())} className="rounded-2xl border border-white/80 bg-white/70 p-3 text-left shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-900/70">“{example}”</button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button onClick={parseTransactions} disabled={isParsing} className="pastel-button text-lg">{isParsing ? "Parsing transactions..." : "Parse Transactions"}</button>
              <button onClick={() => setSmsInput(sampleSms)} className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 font-bold shadow-sm dark:border-white/10 dark:bg-slate-900/80">Load sample SMS</button>
            </div>

            <div className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${status.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100" : status.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100" : "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100"}`}>{status.text}</div>
          </div>

          <aside className="glass-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-black uppercase tracking-wide text-purple-500">Parsed transaction preview</p><h3 className="mt-1 text-3xl font-black">₹{totalPreview.toLocaleString("en-IN")}</h3><p className="text-sm text-slate-500 dark:text-slate-300">Latest parsed batch total</p></div>
              <span className="rounded-full bg-mint px-3 py-1 text-sm font-black text-emerald-900">Live</span>
            </div>

            <div className="mt-5 space-y-3">
              {preview.length ? preview.map((transaction) => (
                <div key={transaction.id} className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
                  <div className="flex items-start justify-between gap-3"><div><p className="font-black">{transaction.merchant}</p><p className="text-xs text-slate-500 dark:text-slate-300">{new Date(transaction.transaction_date).toLocaleDateString()} · {transaction.transaction_type}</p></div><p className="text-lg font-black">₹{transaction.amount.toLocaleString("en-IN")}</p></div>
                  <div className="mt-3 flex items-center justify-between gap-3"><span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700 dark:bg-purple-500/20 dark:text-purple-100">{transaction.category}</span><span className="truncate text-xs text-slate-400">{transaction.raw_sms}</span></div>
                </div>
              )) : <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">Parsed transactions will appear here instantly.</div>}
            </div>
          </aside>
        </section>

        <Dashboard transactions={transactions} onCategoryChange={updateCategory} onExportCsv={exportCsv} />
      </div>
    </main>
  );
}

function mergeTransactions(newItems: Transaction[], existing: Transaction[]) {
  const seen = new Set<string>();
  return [...newItems, ...existing].filter((item) => {
    const key = `${item.raw_sms}-${item.amount}-${item.merchant}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
