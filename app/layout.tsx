import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMS SpendSense | AI Expense Parser",
  description: "Paste bank SMS messages and turn them into editable expense analytics.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
