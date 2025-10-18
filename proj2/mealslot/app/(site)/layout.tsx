import type { ReactNode } from "react";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl p-4">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-xl font-bold">🥗 MealSlot</h1>
        <div className="space-x-2">
          <a href="/" className="underline">Home</a>
          <a href="/party" className="underline">Party Mode</a>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
