import type { Transaction } from "./types";

export const sampleSms = `HDFC Bank: Rs 450 spent at DMART using Debit Card

ICICI Bank: INR 630 debited at Zomato on 02-May-2026

Axis Bank: Rs 280 spent on UBER TRIP

Your OTP for login is 771902. Do not share it.`;

export const sampleTransactions: Transaction[] = [
  {
    id: "sample-1",
    merchant: "DMART",
    amount: 450,
    category: "Groceries",
    raw_sms: "HDFC Bank: Rs 450 spent at DMART using Debit Card",
    transaction_date: "2026-05-09T09:20:00.000Z",
    transaction_type: "debit",
    created_at: "2026-05-09T09:21:00.000Z",
  },
  {
    id: "sample-2",
    merchant: "ZOMATO",
    amount: 630,
    category: "Food",
    raw_sms: "ICICI Bank: INR 630 debited at Zomato on 02-May-2026",
    transaction_date: "2026-05-02T12:30:00.000Z",
    transaction_type: "debit",
    created_at: "2026-05-02T12:31:00.000Z",
  },
  {
    id: "sample-3",
    merchant: "UBER TRIP",
    amount: 280,
    category: "Transport",
    raw_sms: "Axis Bank: Rs 280 spent on UBER TRIP",
    transaction_date: "2026-05-08T18:05:00.000Z",
    transaction_type: "debit",
    created_at: "2026-05-08T18:06:00.000Z",
  },
];
