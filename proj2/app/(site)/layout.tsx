import "../globals.css";
import React from "react";

export const metadata = {
  title: "MealSlot",
  description: "Spin your next meal. Cook or go out. Party mode included."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold">🍽️ MealSlot</h1>
            <a className="text-sm underline" href="/party">Party Mode</a>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
