"use client";

export function CategoryDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} title={label} />
  );
}
