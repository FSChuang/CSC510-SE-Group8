// --- path: components/SiteNav.tsx ---
"use client";

import React from "react";  
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function SiteNav() {
  return (
    <nav className="relative z-50 mx-auto flex max-w-6xl items-center justify-between px-4 py-3 pointer-events-auto">
      <div className="flex items-center gap-6">
        <Link href="/" prefetch className="font-semibold hover:underline">
          Home
        </Link>
        <Link href="/party" prefetch className="hover:underline">
          Party Mode
        </Link>
      </div>
      <ThemeToggle />
    </nav>
  );
}
