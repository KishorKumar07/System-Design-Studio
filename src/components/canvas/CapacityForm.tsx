"use client";

import { Gauge } from "lucide-react";
import { Input, Textarea, Label } from "@/components/ui/Input";
import type { CapacityInputs } from "@/lib/validation/design.schema";

export function CapacityForm({
  value,
  onChange,
}: {
  value: Partial<CapacityInputs>;
  onChange: (next: Partial<CapacityInputs>) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
        <Gauge size={13} />
        Capacity checkpoint
      </p>
      <p className="text-xs text-foreground-muted">
        Commit to real numbers before grading — the review checks your diagram against these.
      </p>
      <Label>
        Expected QPS
        <Input
          type="number"
          min={0}
          value={value.expectedQps ?? ""}
          onChange={(e) => onChange({ ...value, expectedQps: Number(e.target.value) })}
        />
      </Label>
      <Label>
        Read:write ratio
        <Input
          type="text"
          placeholder="e.g. 100:1"
          value={value.readWriteRatio ?? ""}
          onChange={(e) => onChange({ ...value, readWriteRatio: e.target.value })}
        />
      </Label>
      <Label>
        Data volume (GB)
        <Input
          type="number"
          min={0}
          value={value.dataVolumeGb ?? ""}
          onChange={(e) => onChange({ ...value, dataVolumeGb: Number(e.target.value) })}
        />
      </Label>
      <Label>
        Notes (optional)
        <Textarea
          rows={2}
          value={value.notes ?? ""}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
        />
      </Label>
    </div>
  );
}
