export interface SearchableLabeled {
  label: string;
}

export interface SearchableGroup<TItem extends SearchableLabeled> {
  type: "group";
  items: readonly TItem[];
}

export type SearchableChild<TItem extends SearchableLabeled> =
  | TItem
  | SearchableGroup<TItem>;

export interface SearchableSection<TItem extends SearchableLabeled> {
  children: readonly SearchableChild<TItem>[];
}

function isGroupChild<TItem extends SearchableLabeled>(
  child: SearchableChild<TItem>
): child is SearchableGroup<TItem> {
  return (
    typeof child === "object" &&
    child !== null &&
    "type" in child &&
    (child as { type?: unknown }).type === "group"
  );
}

export function filterSidebarSectionsByQuery<
  TItem extends SearchableLabeled,
  TSection extends SearchableSection<TItem>,
>(sections: readonly TSection[], query: string): TSection[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...sections];

  const matches = (item: TItem) => item.label.toLowerCase().includes(needle);

  const result: TSection[] = [];
  for (const section of sections) {
    const children: SearchableChild<TItem>[] = [];
    for (const child of section.children) {
      if (isGroupChild(child)) {
        const items = child.items.filter(matches);
        if (items.length > 0) {
          children.push({ ...child, items });
        }
      } else if (matches(child)) {
        children.push(child);
      }
    }
    if (children.length > 0) {
      result.push({ ...section, children } as TSection);
    }
  }
  return result;
}
