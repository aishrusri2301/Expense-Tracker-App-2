import { categories, Category, Transaction } from "./types";

const ignoredPatterns = [/\botp\b/i, /one[-\s]?time password/i, /verification code/i, /failed/i, /declined/i, /unsuccessful/i, /promo/i, /offer/i, /cashback offer/i, /available balance/i, /statement/i];
const amountPattern = /(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.\d{1,2})?)/i;
const datePatterns = [
  /(?:on|dated?)\s+(\d{1,2}[-/\s](?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[-/\s]\d{2,4})/i,
  /(?:on|dated?)\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
];

export function splitSmsMessages(input: string) {
  return input
    .split(/\n{2,}|(?=\b(?:HDFC|ICICI|Axis|SBI|Kotak|Yes Bank|IDFC|PNB|Canara|Bank)\b)/gi)
    .map((message) => message.trim())
    .filter(Boolean);
}

export function shouldIgnoreSms(message: string) {
  return ignoredPatterns.some((pattern) => pattern.test(message));
}

export function inferCategory(merchant: string, raw: string): Category {
  const text = `${merchant} ${raw}`.toLowerCase();
  const rules: Array<[Category, RegExp]> = [
    ["Food", /zomato|swiggy|restaurant|cafe|coffee|pizza|burger|food|eat/i],
    ["Transport", /uber|ola|rapido|metro|fuel|petrol|diesel|taxi|cab|trip/i],
    ["Groceries", /dmart|bigbasket|grocer|mart|supermarket|fresh|blinkit|zepto|instamart/i],
    ["Bills", /bill|electric|water|gas|recharge|broadband|wifi|mobile|utility/i],
    ["Shopping", /amazon|flipkart|myntra|store|shop|mall|retail|pos/i],
    ["Entertainment", /netflix|prime|hotstar|movie|cinema|spotify|bookmyshow|game/i],
    ["Healthcare", /hospital|clinic|pharmacy|medical|doctor|apollo|medplus/i],
    ["Travel", /flight|hotel|airbnb|rail|irctc|makemytrip|goibibo|travel/i],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] ?? "Other";
}

export function parseDate(raw: string) {
  for (const pattern of datePatterns) {
    const match = raw.match(pattern);
    if (!match?.[1]) continue;
    const date = new Date(match[1].replace(/-/g, " "));
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
}

export function extractMerchant(raw: string) {
  const patterns = [
    /(?:spent|debited|paid|purchase(?:d)?|used)\s+(?:at|on|to|for)\s+([A-Z0-9& .'-]+?)(?:\s+(?:using|on|for|via|ref|txn|transaction|\d{1,2}[-/]))?$/i,
    /(?:at|on|to)\s+([A-Z0-9& .'-]+?)(?:\s+(?:using|on|for|via|ref|txn|transaction|\d{1,2}[-/]))/i,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    const merchant = match?.[1]?.replace(/\s+/g, " ").trim();
    if (merchant && merchant.length > 1) return cleanMerchant(merchant);
  }
  return "Unknown Merchant";
}

function cleanMerchant(value: string) {
  return value
    .replace(/\b(?:debit card|credit card|upi|a\/c|account|card)\b.*$/i, "")
    .replace(/[.,:-]+$/g, "")
    .trim()
    .toUpperCase();
}

export function parseSmsLocally(input: string): { transactions: Transaction[]; ignored: string[] } {
  const ignored: string[] = [];
  const transactions = splitSmsMessages(input).flatMap((raw_sms) => {
    if (shouldIgnoreSms(raw_sms)) {
      ignored.push(raw_sms);
      return [];
    }

    const amountMatch = raw_sms.match(amountPattern);
    const amount = Number(amountMatch?.[1]?.replace(/,/g, ""));
    const isDebit = /spent|debited|paid|purchase|withdrawn|sent|charged/i.test(raw_sms);
    const isCredit = /credited|received|refund/i.test(raw_sms);

    if (!amount || (!isDebit && !isCredit)) {
      ignored.push(raw_sms);
      return [];
    }

    const merchant = extractMerchant(raw_sms);
    const category = inferCategory(merchant, raw_sms);

    return [
      {
        id: crypto.randomUUID(),
        merchant,
        amount,
        category,
        raw_sms,
        transaction_date: parseDate(raw_sms),
        transaction_type: isCredit ? "credit" : "debit",
        created_at: new Date().toISOString(),
      } satisfies Transaction,
    ];
  });

  return { transactions, ignored };
}

export function normalizeCategory(value: string): Category {
  return categories.find((category) => category.toLowerCase() === value.toLowerCase()) ?? "Other";
}
