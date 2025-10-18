"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { PartyClient } from "@/components/PartyClient";

function PartyPageInner() {
  const [code, setCode] = useState<string>("");
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Party Mode</h2>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.currentTarget.value.toUpperCase().slice(0, 6))}
          placeholder="Enter 6-char code"
          className="w-40 rounded border px-2 py-1"
          aria-label="Party Code"
        />
        <PartyClient code={code} />
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(PartyPageInner), { ssr: false });
