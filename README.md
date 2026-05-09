# SMS SpendSense — AI Expense Tracker

A fully functional Next.js 15 expense tracker where the primary workflow is copying and pasting bank SMS messages, parsing them into real transactions, and immediately updating editable analytics.

## What the app does

1. User lands on the homepage and immediately sees the **Paste Bank SMS** hero section.
2. User pastes one or more bank SMS messages.
3. User clicks **Parse Transactions**.
4. The backend extracts merchant, amount, transaction date, transaction type, and category.
5. Parsed transactions appear in a visible preview and are added to the dashboard.
6. Users can edit categories manually.
7. Charts, top merchants, totals, and CSV export update from the same transaction state.

The app gracefully degrades: if OpenAI or Supabase keys are missing, it still runs locally with a demo parser and sample transactions.

## Tech stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Recharts
- Supabase
- OpenAI API

## Local setup

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and paste sample SMS messages such as:

```text
HDFC Bank: Rs 450 spent at DMART using Debit Card

ICICI Bank: INR 630 debited at Zomato on 02-May-2026

Axis Bank: Rs 280 spent on UBER TRIP
```

## Environment variables

Create `.env.local` when you want AI parsing and Supabase persistence:

```bash
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

All variables are optional for local demos. Without `OPENAI_API_KEY`, `/api/parse` uses the local parser. Without Supabase variables, parsed transactions remain in the browser session and the API response explains that storage was skipped.

## Supabase schema

Run this SQL in Supabase SQL editor:

```sql
create table if not exists transactions (
  id uuid primary key,
  merchant text not null,
  amount numeric not null,
  category text not null check (category in ('Food', 'Transport', 'Shopping', 'Bills', 'Groceries', 'Entertainment', 'Healthcare', 'Travel', 'Other')),
  raw_sms text not null,
  transaction_date timestamptz not null,
  transaction_type text not null check (transaction_type in ('debit', 'credit', 'ignored')),
  created_at timestamptz not null default now()
);
```

For a production multi-user app, add a `user_id` column and enable row-level security policies. This demo uses the service role key only on the server API route and never exposes it to the browser.

## Parsing behavior

- OpenAI is used when `OPENAI_API_KEY` is available.
- The local parser extracts common Indian bank SMS patterns with `Rs`, `INR`, or `₹` amounts.
- OTPs, failed/declined transactions, balance alerts, and promotional messages are ignored.
- Categories supported: Food, Transport, Shopping, Bills, Groceries, Entertainment, Healthcare, Travel, Other.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Add the optional environment variables above in Vercel project settings.
4. Deploy.

The app is deployable even without environment variables because the local parser and sample transactions keep the workflow usable.

## Useful scripts

```bash
npm run dev        # start the local dev server
npm run build      # production build
npm run typecheck  # TypeScript check
npm run lint       # Next.js lint command
```
