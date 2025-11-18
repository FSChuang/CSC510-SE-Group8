// --- path: components/DishCountInput.tsx ---
"use client";

import React, { useState, type ChangeEvent } from "react";

type DishCountInputProps = {
  value: number;
  onChange: (newCount: number) => void;
};

export default function DishCountInput({ value, onChange }: DishCountInputProps) {
  const [input, setInput] = useState(value.toString());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty string so user can delete and type
    if (/^\d*$/.test(val)) {
      setInput(val);
      if (val === "") return;
      const parsed = Math.max(0, parseInt(val, 10) || 0);
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    // Normalize empty to previous value (or 0)
    if (input === "") {
      setInput(String(value ?? 0));
      onChange(value ?? 0);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Number of Dishes:</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={input}
        onChange={handleChange}
        onBlur={handleBlur}
        className={[
          "w-16 rounded border px-2 py-1 text-sm",
          // ✅ explicit light-mode styles
          "bg-white text-neutral-900 placeholder:text-neutral-500 border-neutral-300",
          // ✅ dark-mode styles
          "dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:border-neutral-700",
          // focus states
          "focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400",
          "dark:focus:ring-neutral-600 dark:focus:border-neutral-600",
        ].join(" ")}
        placeholder="0"
        aria-label="Number of dishes"
      />
    </div>
  );
}
