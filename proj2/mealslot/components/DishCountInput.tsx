"use client";

import { useState } from "react";

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
      const num = Number(val);
      if (val !== "" && num > 0) {
        onChange(num);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Number of Dishes:</label>
      <input
        type="text"
        value={input}
        onChange={handleChange}
        className="w-16 rounded border px-2 py-1 text-sm"
      />
    </div>
  );
}
