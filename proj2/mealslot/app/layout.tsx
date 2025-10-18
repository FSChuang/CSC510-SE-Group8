import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "MealSlot",
  description: "Decide what to eat with a slot-machine twist."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
