import type {
  SidebarItemDefinition,
  SidebarItemGroup,
  SidebarSectionChild,
  SidebarSectionDefinition,
} from "./types";

const HOME_ITEMS: readonly SidebarItemDefinition[] = [
  {
    id: "home",
    href: "/dashboard",
    i18nKey: "home",
    subtitleKey: "homeSubtitle",
    labelFallback: "Home",
    icon: "home",
    exact: true,
  },
];

const MAIN_ITEMS: readonly SidebarItemDefinition[] = [
  {
    id: "endpoints",
    href: "/dashboard/endpoint",
    i18nKey: "endpoints",
    subtitleKey: "endpointsSubtitle",
    labelFallback: "Endpoints",
    icon: "api",
  },
  {
    id: "api-manager",
    href: "/dashboard/api-manager",
    i18nKey: "apiManager",
    subtitleKey: "apiManagerSubtitle",
    labelFallback: "API Keys",
    icon: "vpn_key",
  },
  {
    id: "providers",
    href: "/dashboard/providers",
    i18nKey: "providers",
    subtitleKey: "providersSubtitle",
    labelFallback: "Providers",
    icon: "dns",
  },
  {
    id: "combos",
    href: "/dashboard/combos",
    i18nKey: "combos",
    subtitleKey: "combosSubtitle",
    labelFallback: "Combo",
    icon: "layers",
  },
  {
    id: "quota",
    href: "/dashboard/limits",
    i18nKey: "providerQuota",
    subtitleKey: "providerQuotaSubtitle",
    labelFallback: "Provider Quota",
    icon: "tune",
  },
  {
    id: "cli-code",
    href: "/dashboard/cli-tools",
    i18nKey: "cliCode",
    subtitleKey: "cliCodeSubtitle",
    labelFallback: "CLI-Code",
    icon: "terminal",
  },
  {
    id: "proxy",
    href: "/dashboard/system/proxy",
    i18nKey: "proxy",
    subtitleKey: "proxySubtitle",
    labelFallback: "Proxy",
    icon: "dns",
  },
];

const MONITORING_ITEMS: readonly SidebarItemDefinition[] = [
  {
    id: "analytics",
    href: "/dashboard/analytics",
    i18nKey: "usage",
    subtitleKey: "usageSubtitle",
    labelFallback: "Usage",
    icon: "analytics",
  },
  {
    id: "logs",
    href: "/dashboard/logs",
    i18nKey: "logs",
    subtitleKey: "logsSubtitle",
    labelFallback: "Logs",
    icon: "description",
  },
  {
    id: "logs-console",
    href: "/dashboard/logs?tab=console",
    i18nKey: "consoleLogs",
    subtitleKey: "consoleLogsSubtitle",
    labelFallback: "Console Logs",
    icon: "terminal",
  },
];

export const SIDEBAR_SECTIONS: readonly SidebarSectionDefinition[] = [
  {
    id: "home",
    titleKey: "home",
    titleFallback: "Home",
    children: HOME_ITEMS,
    showTitle: false,
  },
  {
    id: "omni-proxy",
    titleKey: "omniProxySection",
    titleFallback: "Menu",
    children: MAIN_ITEMS,
    defaultPinned: true,
  },
  {
    id: "monitoring",
    titleKey: "monitoringSection",
    titleFallback: "Monitoring",
    children: MONITORING_ITEMS,
  },
] as const;
