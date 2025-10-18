"use client";

import { motion } from "framer-motion";

type Props = {
  label: string;
  value: string;
  locked: boolean;
  onToggleLock: () => void;
};

export default function SlotReel({ label, value, locked, onToggleLock }: Props) {
  return (
    <div className={`rounded-md border bg-white p-2 ${locked ? "locked" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">{label.toUpperCase()}</div>
        <button
          onClick={onToggleLock}
          className={`text-xs px-2 py-1 rounded border ${locked ? "bg-green-600 text-white" : "bg-gray-100"}`}
          aria-pressed={locked}
        >
          {locked ? "Locked" : "Lock"}
        </button>
      </div>
      <div className="overflow-hidden h-10 mt-1">
        <motion.div
          key={value}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 18 }}
          className="h-10 flex items-center"
        >
          <div className="text-base font-medium">{value}</div>
        </motion.div>
      </div>
    </div>
  );
}
