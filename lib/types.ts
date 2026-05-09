export const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Groceries",
  "Entertainment",
  "Healthcare",
  "Travel",
  "Other",
] as const;

export type Category = (typeof categories)[number];

export type TransactionType = "debit" | "credit" | "ignored";

export type Transaction = {
  id: string;
  merchant: string;
  amount: number;
  category: Category;
  raw_sms: string;
  transaction_date: string;
  transaction_type: TransactionType;
  created_at: string;
};

export type ParseResponse = {
  transactions: Transaction[];
  ignored: string[];
  source: "openai" | "local-demo";
  savedToSupabase: boolean;
  message: string;
};
