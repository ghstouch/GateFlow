export const HIDEABLE_SIDEBAR_ITEM_IDS = [
  "home",
  "endpoints",
  "api-manager",
  "providers",
  "combos",
  "quota",
  "cli-code",
  "proxy",
  "analytics",
  "logs",
] as const;

export type HideableSidebarItemId = (typeof HIDEABLE_SIDEBAR_ITEM_IDS)[number];

export type SidebarSectionId =
  | "home"
  | "omni-proxy"
  | "analytics"
  | "costs"
  | "monitoring"
  | "devtools"
  | "agentic-features"
  | "other-features"
  | "configuration"
  | "help";

export interface SidebarItemDefinition {
  id: HideableSidebarItemId;
  href: string;
  i18nKey: string;
  subtitleKey?: string;
  labelFallback?: string;
  subtitleFallback?: string;
  icon: string;
  exact?: boolean;
  external?: boolean;
}

export interface SidebarItemGroup {
  type: "group";
  id: string;
  titleKey: string;
  titleFallback: string;
  items: readonly SidebarItemDefinition[];
}

export type SidebarSectionChild = SidebarItemDefinition | SidebarItemGroup;

export interface SidebarSectionDefinition {
  id: SidebarSectionId;
  titleKey: string;
  titleFallback: string;
  children: readonly SidebarSectionChild[];
  showTitle?: boolean;
  visibility?: "always" | "debug";
  defaultPinned?: boolean;
}

export type SidebarPresetId = "all" | "minimal" | "developer" | "admin";

export interface SidebarPresetDefinition {
  id: SidebarPresetId;
  icon: string;
  hiddenItems: HideableSidebarItemId[];
}

export type SidebarItemOrder = Partial<Record<SidebarSectionId, string[]>>;
