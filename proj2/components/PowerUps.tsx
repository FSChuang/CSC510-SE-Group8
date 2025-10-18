"use client";

type Props = {
  values: { healthy: number; cheap: number; t30: number };
  onChange: (v: { healthy: number; cheap: number; t30: number }) => void;
};

export default function PowerUps({ values, onChange }: Props) {
  function set<K extends keyof Props["values"]>(k: K, v: number) {
    onChange({ ...values, [k]: v });
  }
  return (
    <div className="rounded-md border bg-white p-4">
      <h3 className="font-medium mb-2">Power-ups</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="text-sm">
          <div className="mb-1">Healthy</div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={values.healthy}
            onChange={(e) => set("healthy", parseFloat(e.target.value))}
            className="w-full"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1">Cheap</div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={values.cheap}
            onChange={(e) => set("cheap", parseFloat(e.target.value))}
            className="w-full"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1">≤ 30m</div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={values.t30}
            onChange={(e) => set("t30", parseFloat(e.target.value))}
            className="w-full"
          />
        </label>
      </div>
    </div>
  );
}
