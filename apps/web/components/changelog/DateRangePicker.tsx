"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

const PRESETS: Array<{ label: string; days: number }> = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoMinusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label htmlFor="date-from" className="text-xs font-medium">
            From
          </label>
          <Input
            id="date-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => onChange(e.target.value, to)}
            className="w-40"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="date-to" className="text-xs font-medium">
            To
          </label>
          <Input
            id="date-to"
            type="date"
            value={to}
            min={from || undefined}
            max={todayISO()}
            onChange={(e) => onChange(from, e.target.value)}
            className="w-40"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(isoMinusDays(p.days), todayISO())}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
