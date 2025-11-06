// --- path: app/(site)/party/page.tsx ---
"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import PartyClient from "@/components/PartyClient";

export default function PartyPage() {
  // Optional: support /party?code=ABC123 for quick join
  const sp = useSearchParams();
  const code = useMemo(() => {
    const raw = sp.get("code") ?? "";
    return raw.toUpperCase().slice(0, 6);
  }, [sp]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Party Mode</h2>
      {/* No extra input here; PartyClient handles Create/Join and shows the active code */}
      <PartyClient code={code} />
    </div>
  );
}
