import { NextRequest, NextResponse } from "next/server";
import { parseSmsLocally, normalizeCategory, shouldIgnoreSms } from "../../../lib/parser";
import { saveTransactionsToSupabase } from "../../../lib/supabase";
import type { Transaction } from "../../../lib/types";

export const dynamic = "force-dynamic";

type OpenAiTransaction = {
  merchant?: string;
  amount?: number;
  category?: string;
  raw_sms?: string;
  transaction_date?: string;
  transaction_type?: "debit" | "credit";
};

export async function POST(request: NextRequest) {
  try {
    const { sms } = (await request.json()) as { sms?: string };
    if (!sms?.trim()) {
      return NextResponse.json({ error: "Paste at least one bank SMS message to parse." }, { status: 400 });
    }

    const localResult = parseSmsLocally(sms);
    let transactions = localResult.transactions;
    let ignored = localResult.ignored;
    let source: "openai" | "local-demo" = "local-demo";

    if (process.env.OPENAI_API_KEY) {
      try {
        const aiTransactions = await parseWithOpenAI(sms);
        if (aiTransactions.length > 0) {
          transactions = aiTransactions;
          ignored = sms
            .split(/\n{2,}/)
            .map((message) => message.trim())
            .filter((message) => message && shouldIgnoreSms(message));
          source = "openai";
        }
      } catch (error) {
        console.warn("OpenAI parsing failed, using local parser fallback:", error);
      }
    }

    const savedToSupabase = await saveTransactionsToSupabase(transactions);

    return NextResponse.json({
      transactions,
      ignored,
      source,
      savedToSupabase,
      message: buildMessage(transactions.length, ignored.length, source, savedToSupabase),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not parse messages. Please try again." }, { status: 500 });
  }
}

async function parseWithOpenAI(sms: string): Promise<Transaction[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract bank SMS expense transactions as JSON. Ignore OTP, balance alerts, failed transactions, and promotions. Return {\"transactions\":[...]} only. Required categories: Food, Transport, Shopping, Bills, Groceries, Entertainment, Healthcare, Travel, Other. transaction_type must be debit or credit. Use ISO dates; if missing, use today's date.",
        },
        { role: "user", content: sms },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const completion = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = completion.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as { transactions?: OpenAiTransaction[] };
  const now = new Date().toISOString();

  return (parsed.transactions ?? [])
    .filter((item) => item.amount && item.merchant)
    .map((item) => ({
      id: crypto.randomUUID(),
      merchant: String(item.merchant).trim().toUpperCase(),
      amount: Number(item.amount),
      category: normalizeCategory(String(item.category ?? "Other")),
      raw_sms: String(item.raw_sms ?? sms),
      transaction_date: toIsoDate(item.transaction_date),
      transaction_type: item.transaction_type === "credit" ? "credit" : "debit",
      created_at: now,
    }));
}

function toIsoDate(value?: string) {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function buildMessage(count: number, ignored: number, source: "openai" | "local-demo", saved: boolean) {
  const parser = source === "openai" ? "AI parser" : "local demo parser";
  const storage = saved ? "Saved to Supabase." : "Running locally; Supabase is not configured or save was skipped.";
  return `${parser} found ${count} transaction${count === 1 ? "" : "s"}. Ignored ${ignored} non-transaction message${ignored === 1 ? "" : "s"}. ${storage}`;
}
