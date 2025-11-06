// --- path: app/(site)/layout.tsx ---
import type { ReactNode } from "react";
import SiteNav from "@/components/SiteNav";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
        <SiteNav />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
