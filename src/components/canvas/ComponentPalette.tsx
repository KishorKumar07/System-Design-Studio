"use client";

import { PALETTE, CATEGORY_COLOR, type PaletteItem } from "@/lib/palette";

export function ComponentPalette() {
  function onDragStart(e: React.DragEvent, item: PaletteItem) {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside className="h-full w-full overflow-y-auto bg-background-soft p-4">
      <p className="mb-4 text-xs text-foreground-subtle">Drag a component onto the canvas.</p>
      {Object.entries(PALETTE).map(([group, items]) => (
        <div key={group} className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">{group}</p>
          <div className="flex flex-col gap-1.5">
            {items.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item)}
                className="flex cursor-grab items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm transition-all hover:translate-x-0.5 hover:border-border-strong hover:bg-surface-hover active:cursor-grabbing active:scale-[0.97]"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLOR[item.category] }}
                />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
