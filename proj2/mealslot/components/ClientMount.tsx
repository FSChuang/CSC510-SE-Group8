// --- path: components/ClientMount.tsx ---
"use client";

import type { ReactNode } from "react";
// import HardDarkSwitch from "@/components/HardDarkSwitch";

/** Client-only wrapper rendered inside the server layout’s <body>. */
export default function ClientMount({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
