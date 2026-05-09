import type { Transaction } from "./types";

export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function saveTransactionsToSupabase(transactions: Transaction[]) {
  if (!hasSupabaseConfig() || transactions.length === 0) return false;

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/transactions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(
      transactions.map(({ id, merchant, amount, category, raw_sms, transaction_date, transaction_type, created_at }) => ({
        id,
        merchant,
        amount,
        category,
        raw_sms,
        transaction_date,
        transaction_type,
        created_at,
      })),
    ),
  });

  if (!response.ok) {
    console.warn("Supabase save skipped:", await response.text());
    return false;
  }

  return true;
}
