"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { categories, Category, Transaction } from "../lib/types";

const palette = ["#fb7185", "#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#2dd4bf", "#818cf8", "#94a3b8"];

export function Dashboard({ transactions, onCategoryChange, onExportCsv }: { transactions: Transaction[]; onCategoryChange: (id: string, category: Category) => void; onExportCsv: () => void }) {
  const debitTransactions = transactions.filter((transaction) => transaction.transaction_type === "debit");
  const total = debitTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const categoryData = categories.map((category) => ({ name: category, value: debitTransactions.filter((transaction) => transaction.category === category).reduce((sum, transaction) => sum + transaction.amount, 0) })).filter((item) => item.value > 0);
  const monthlyData = groupByDate(debitTransactions, "month");
  const dailyData = groupByDate(debitTransactions, "day");
  const topMerchants = Object.entries(groupSum(debitTransactions, (transaction) => transaction.merchant)).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <section className="mx-auto mt-8 grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Parsed transactions" value={transactions.length.toString()} accent="from-pink-300 to-rose-200" />
        <StatCard label="Total debit spend" value={`₹${total.toLocaleString("en-IN")}`} accent="from-sky-300 to-blue-200" />
        <StatCard label="Top category" value={categoryData[0]?.name ?? "None yet"} accent="from-purple-300 to-violet-200" />
        <StatCard label="Merchants found" value={new Set(transactions.map((item) => item.merchant)).size.toString()} accent="from-mint to-emerald-200" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartCard title="Spending by category" subtitle="Updates as parsed SMS transactions are added.">
          {categoryData.length ? (
            <ResponsiveContainer width="100%" height={290}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={105} paddingAngle={4}>
                  {categoryData.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>

        <ChartCard title="Top merchants" subtitle="Real merchants extracted from pasted messages.">
          <div className="space-y-4">
            {topMerchants.length ? topMerchants.map(([merchant, amount], index) => (
              <div key={merchant}>
                <div className="mb-1 flex items-center justify-between text-sm font-semibold"><span>{merchant}</span><span>₹{amount.toLocaleString("en-IN")}</span></div>
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-3 rounded-full bg-gradient-to-r from-pink-400 to-sky-400" style={{ width: `${Math.max(12, (amount / topMerchants[0][1]) * 100)}%` }} /></div>
              </div>
            )) : <EmptyState />}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Monthly spending" subtitle="Compare spend by month.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis /><Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} /><Bar dataKey="amount" radius={[12, 12, 0, 0]} fill="#a78bfa" /></BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Daily spending trend" subtitle="See immediate changes after parsing.">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis /><Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} /><Line type="monotone" dataKey="amount" stroke="#fb7185" strokeWidth={4} dot={{ r: 5 }} /></LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-2xl font-black">Recent transactions</h2><p className="text-sm text-slate-500 dark:text-slate-300">Edit categories manually; charts recalculate instantly.</p></div>
          <button onClick={onExportCsv} className="rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-lg dark:bg-white dark:text-ink">Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-300"><tr><th className="px-5 py-4">Merchant</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Raw SMS</th></tr></thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-t border-slate-100 dark:border-white/10">
                  <td className="px-5 py-4 font-bold">{transaction.merchant}</td>
                  <td className="px-5 py-4">₹{transaction.amount.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                  <td className="px-5 py-4 capitalize">{transaction.transaction_type}</td>
                  <td className="px-5 py-4"><select value={transaction.category} onChange={(event) => onCategoryChange(transaction.id, event.target.value as Category)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold dark:border-slate-700 dark:bg-slate-900">{categories.map((category) => <option key={category}>{category}</option>)}</select></td>
                  <td className="max-w-xs truncate px-5 py-4 text-slate-500 dark:text-slate-300" title={transaction.raw_sms}>{transaction.raw_sms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return <div className={`rounded-[1.75rem] bg-gradient-to-br ${accent} p-5 shadow-card`}><p className="text-sm font-bold text-ink/70">{label}</p><p className="mt-2 text-3xl font-black text-ink">{value}</p></div>;
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="glass-card p-5"><h2 className="text-2xl font-black">{title}</h2><p className="mb-4 text-sm text-slate-500 dark:text-slate-300">{subtitle}</p>{children}</div>;
}

function EmptyState() {
  return <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-slate-300 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">Paste SMS messages above to populate this section.</div>;
}

function groupSum(transactions: Transaction[], keyFn: (transaction: Transaction) => string) {
  return transactions.reduce<Record<string, number>>((acc, transaction) => {
    const key = keyFn(transaction);
    acc[key] = (acc[key] ?? 0) + transaction.amount;
    return acc;
  }, {});
}

function groupByDate(transactions: Transaction[], mode: "month" | "day") {
  const grouped = groupSum(transactions, (transaction) => {
    const date = new Date(transaction.transaction_date);
    return mode === "month" ? date.toLocaleString("en-US", { month: "short", year: "2-digit" }) : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
  return Object.entries(grouped).map(([label, amount]) => ({ label, amount }));
}
