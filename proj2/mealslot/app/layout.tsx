// --- path: app/layout.tsx ---
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "MealSlot",
  description: "Spin for meals that fit your mood",
};

const noFoucScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');           // "dark" | "light" | null
    var prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? (stored === 'dark') : prefers;
    document.documentElement.classList.toggle('dark', !!dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFoucScript }} />
      </head>
      <body className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        {children}
      </body>
    </html>
  );
}
