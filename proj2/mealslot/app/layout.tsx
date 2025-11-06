// --- path: app/layout.tsx ---
import "./globals.css";
import type { ReactNode } from "react";
import ThemeProvider from "@/components/theme-provider";

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

    // expose a tiny debugger hook so you can flip from DevTools
    window.__flipTheme = function() {
      var now = document.documentElement.classList.contains('dark');
      var next = !now;
      document.documentElement.classList.toggle('dark', next);
      try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
      return next;
    };
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFoucScript }} />
      </head>
      <body className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
