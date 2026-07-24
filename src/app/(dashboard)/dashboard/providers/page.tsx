"use client";

import { useState, useEffect, useCallback } from "react";
import { CardSkeleton } from "@/shared/components/Loading";
import Badge from "@/shared/components/Badge";
import Button from "@/shared/components/Button";
import Input from "@/shared/components/Input";
import {
  FREE_PROVIDERS,
  OAUTH_PROVIDERS,
  AGGREGATOR_PROVIDER_IDS,
  EMBEDDING_RERANK_PROVIDER_IDS,
  ENTERPRISE_CLOUD_PROVIDER_IDS,
  IMAGE_ONLY_PROVIDER_IDS,
  VIDEO_PROVIDER_IDS,
  isClaudeCodeCompatibleProvider,
  CLOUD_AGENT_PROVIDERS,
  LOCAL_PROVIDERS,
  AUDIO_ONLY_PROVIDERS,
  SEARCH_PROVIDERS,
  WEB_COOKIE_PROVIDERS,
  UPSTREAM_PROXY_PROVIDERS,
} from "@/shared/constants/providers";
import { useRouter } from "next/navigation";
import { getErrorCode, getRelativeTime } from "@/shared/utils";
import { pickDisplayValue } from "@/shared/utils/maskEmail";
import useEmailPrivacyStore from "@/store/emailPrivacyStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useTranslations } from "next-intl";
import {
  buildMergedOAuthProviderEntries,
  buildStaticProviderEntries,
  buildProviderEntries,
  filterConfiguredProviderEntries,
} from "./providerPageUtils";
import type { ProviderEntry } from "./providerPageUtils";
import { readConfiguredOnlyPreference, writeConfiguredOnlyPreference } from "./providerPageStorage";
import {
  getCodexEffectiveFastServiceTier,
  isCodexGlobalFastServiceTierEnabled,
} from "@/lib/providers/codexFastTier";
import AddCompatibleProviderModal from "./components/AddCompatibleProviderModal";
import ProviderCard from "./components/ProviderCard";
import ProviderCountBadge from "./components/ProviderCountBadge";
import ProviderSummaryCard from "./components/ProviderSummaryCard";
import type { ProviderSummaryStats } from "./components/ProviderSummaryCard";

function countConfigured<T>(entries: ProviderEntry<T>[]) {
  return {
    configured: entries.filter((entry) => Number(entry.stats?.total || 0) > 0).length,
    total: entries.length,
  };
}

type ProviderBatchTestResult = {
  connectionId?: string;
  connectionName?: string;
  provider?: string;
  valid?: boolean;
  latencyMs?: number;
  diagnosis?: { type?: string };
};

type ProviderBatchTestResults = {
  mode?: string;
  results?: ProviderBatchTestResult[];
  summary?: {
    total?: number;
    passed?: number;
    failed?: number;
  };
  error?: string | { message?: string };
};

function getConnectionErrorTag(connection) {
  if (!connection) return null;

  const explicitType = connection.lastErrorType;
  if (explicitType === "runtime_error") return "RUNTIME";
  if (
    explicitType === "upstream_auth_error" ||
    explicitType === "auth_missing" ||
    explicitType === "token_refresh_failed" ||
    explicitType === "token_expired"
  ) {
    return "AUTH";
  }
  if (explicitType === "upstream_rate_limited") return "429";
  if (explicitType === "upstream_unavailable") return "5XX";
  if (explicitType === "network_error") return "NET";

  const numericCode = Number(connection.errorCode);
  if (Number.isFinite(numericCode) && numericCode >= 400) {
    return String(numericCode);
  }

  const fromMessage = getErrorCode(connection.lastError);
  if (fromMessage === "401" || fromMessage === "403") return "AUTH";
  if (fromMessage && fromMessage !== "ERR") return fromMessage;

  const msg = (connection.lastError || "").toLowerCase();
  if (msg.includes("runtime") || msg.includes("not runnable") || msg.includes("not installed"))
    return "RUNTIME";
  if (
    msg.includes("invalid api key") ||
    msg.includes("token invalid") ||
    msg.includes("revoked") ||
    msg.includes("unauthorized")
  )
    return "AUTH";

  return "ERR";
}

export default function ProvidersPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<any[]>([]);
  const [providerNodes, setProviderNodes] = useState<any[]>([]);
  const [ccCompatibleProviderEnabled, setCcCompatibleProviderEnabled] = useState(false);
  const [expirations, setExpirations] = useState<any>(null);
  const [codexGlobalFastServiceTier, setCodexGlobalFastServiceTier] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddCompatibleModal, setShowAddCompatibleModal] = useState(false);
  const [showAddAnthropicCompatibleModal, setShowAddAnthropicCompatibleModal] = useState(false);
  const [showAddCcCompatibleModal, setShowAddCcCompatibleModal] = useState(false);
  const [testingMode, setTestingMode] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [importingZed, setImportingZed] = useState(false);
  const [showConfiguredOnly, setShowConfiguredOnly] = useState(false);
  const [configuredOnlyPreferenceReady, setConfiguredOnlyPreferenceReady] = useState(false);
  const [oauthEnvRepairStatus, setOauthEnvRepairStatus] = useState<{
    available: boolean;
    missingCount: number;
  } | null>(null);
  const [repairingEnv, setRepairingEnv] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeMediaKind, setActiveMediaKind] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<"all" | "configured" | "compact">("all");
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const notify = useNotificationStore();
  const t = useTranslations("providers");
  const tc = useTranslations("common");
  const ccCompatibleLabel = t("ccCompatibleLabel");
  const addCcCompatibleLabel = t("addCcCompatible");

  // ── Scroll position restoration ────────────────────────────────────────
  // The main content area uses a nested scrollable div (not the window),
  // so the browser's native scroll restoration doesn't work. We save and
  // restore manually via sessionStorage.
  const SCROLL_KEY = "providers-scroll-y";

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(
      "#main-content > div.flex-1.overflow-y-auto"
    );
    if (!container) return;

    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      // Defer to after paint so the DOM is fully laid out
      requestAnimationFrame(() => {
        container.scrollTop = Number(saved);
        sessionStorage.removeItem(SCROLL_KEY);
      });
    }

    const saveScroll = () => {
      sessionStorage.setItem(SCROLL_KEY, String(container.scrollTop));
    };

    // Save on any in-page link click (provider card navigation)
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (anchor?.getAttribute("href")?.startsWith("/dashboard/providers/")) {
        saveScroll();
      }
    };
    document.addEventListener("click", handleClick, true);

    // Also save on popstate (back/forward button)
    window.addEventListener("popstate", saveScroll);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", saveScroll);
    };
  }, []);

  useEffect(() => {
    setShowConfiguredOnly(readConfiguredOnlyPreference());
    setConfiguredOnlyPreferenceReady(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [connectionsRes, nodesRes, expirationsRes, settingsRes] = await Promise.all([
          fetch("/api/providers"),
          fetch("/api/provider-nodes"),
          fetch("/api/providers/expiration"),
          fetch("/api/settings", { cache: "no-store" }),
        ]);
        const connectionsData = await connectionsRes.json();
        const nodesData = await nodesRes.json();
        const expirationsData = await expirationsRes.json();
        const settingsData = settingsRes.ok ? await settingsRes.json() : null;
        if (connectionsRes.ok) setConnections(connectionsData.connections || []);
        if (nodesRes.ok) {
          setProviderNodes(nodesData.nodes || []);
          setCcCompatibleProviderEnabled(nodesData.ccCompatibleProviderEnabled === true);
        }
        if (expirationsRes.ok && expirationsData) setExpirations(expirationsData);
        setCodexGlobalFastServiceTier(isCodexGlobalFastServiceTierEnabled(settingsData));
      } catch (error) {
        console.log("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!configuredOnlyPreferenceReady) return;

    writeConfiguredOnlyPreference(showConfiguredOnly);
  }, [configuredOnlyPreferenceReady, showConfiguredOnly]);

  const fetchOauthEnvRepairStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/system/env/repair", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setOauthEnvRepairStatus({
          available: Boolean(data.available),
          missingCount: Number(data.missingCount || 0),
        });
      } else {
        setOauthEnvRepairStatus(null);
      }
    } catch {
      setOauthEnvRepairStatus(null);
    }
  }, []);

  useEffect(() => {
    void fetchOauthEnvRepairStatus();
  }, [fetchOauthEnvRepairStatus]);

  const handleZedImport = async () => {
    setImportingZed(true);
    try {
      const res = await fetch("/api/providers/zed/import", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.count > 0) {
          notify.success(
            t("zedImportSuccess", { count: data.count, providers: data.providers.join(", ") })
          );
          // Refresh connections silently
          const connectionsRes = await fetch("/api/providers");
          const connectionsData = await connectionsRes.json();
          if (connectionsRes.ok) setConnections(connectionsData.connections || []);
        } else {
          notify.info(t("zedImportNone"));
        }
      } else {
        notify.error(data.error || t("zedImportFailed"));
      }
    } catch (error) {
      notify.error(t("zedImportNetworkError"));
    } finally {
      setImportingZed(false);
    }
  };

  const handleRepairEnv = async () => {
    if (!oauthEnvRepairStatus?.available || repairingEnv) return;

    setRepairingEnv(true);
    try {
      const res = await fetch("/api/system/env/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("repairEnvFailed"));
      }
      notify.success(
        data.backupPath ? `${t("repairEnvSuccess")} (${data.backupPath})` : t("repairEnvSuccess")
      );
      await fetchOauthEnvRepairStatus();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : t("repairEnvFailed"));
    } finally {
      setRepairingEnv(false);
    }
  };

  const getProviderStats = (providerId, authType) => {
    const providerConnections = connections.filter((c) => {
      if (c.provider !== providerId) return false;
      if (authType === "free") return true;
      return c.authType === authType;
    });

    // Helper: check if connection is effectively active (cooldown expired)
    const getEffectiveStatus = (conn) => {
      const isCooldown =
        conn.rateLimitedUntil && new Date(conn.rateLimitedUntil).getTime() > Date.now();
      return conn.testStatus === "unavailable" && !isCooldown ? "active" : conn.testStatus;
    };

    const connected = providerConnections.filter((c) => {
      const status = getEffectiveStatus(c);
      return status === "active" || status === "success";
    }).length;

    const errorConns = providerConnections.filter((c) => {
      const status = getEffectiveStatus(c);
      return status === "error" || status === "expired" || status === "unavailable";
    });

    const error = errorConns.length;
    const total = providerConnections.length;

    // Check if all connections are manually disabled
    const allDisabled = total > 0 && providerConnections.every((c) => c.isActive === false);

    // Get latest error info
    const latestError = errorConns.sort(
      (a: any, b: any) =>
        (new Date(b.lastErrorAt || 0) as any) - (new Date(a.lastErrorAt || 0) as any)
    )[0];
    const errorCode = latestError ? getConnectionErrorTag(latestError) : null;
    const errorTime = latestError?.lastErrorAt ? getRelativeTime(latestError.lastErrorAt) : null;

    // Check expirations
    const providerExpirations =
      expirations?.list?.filter((e: any) => e.provider === providerId) || [];
    const hasExpired = providerExpirations.some((e: any) => e.status === "expired");
    const hasExpiringSoon = providerExpirations.some((e: any) => e.status === "expiring_soon");
    let expiryStatus = null;
    if (hasExpired) expiryStatus = "expired";
    else if (hasExpiringSoon) expiryStatus = "expiring_soon";

    const codexFastActive =
      providerId === "codex" &&
      (codexGlobalFastServiceTier ||
        providerConnections.some((connection) =>
          getCodexEffectiveFastServiceTier(connection.providerSpecificData, false)
        ));

    return {
      connected,
      error,
      total,
      errorCode,
      errorTime,
      allDisabled,
      expiryStatus,
      codexFastActive,
    };
  };

  // Toggle all connections for a provider on/off
  const handleToggleProvider = async (providerId: string, authType: string, newActive: boolean) => {
    const providerConns = connections.filter((c) => {
      if (c.provider !== providerId) return false;
      if (authType === "free") return true;
      return c.authType === authType;
    });
    // Optimistically update UI
    setConnections((prev) =>
      prev.map((c) =>
        c.provider === providerId && (authType === "free" || c.authType === authType)
          ? { ...c, isActive: newActive }
          : c
      )
    );
    // Fire API calls in parallel
    await Promise.allSettled(
      providerConns.map((c) =>
        fetch(`/api/providers/${c.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: newActive }),
        })
      )
    );
  };

  const handleBatchTest = async (mode, providerId = null) => {
    if (testingMode) return;
    setTestingMode(mode === "provider" ? providerId : mode);
    setTestResults(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90_000); // 90s max
    try {
      const res = await fetch("/api/providers/test-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, providerId }),
        signal: controller.signal,
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        // Response body is not valid JSON (e.g. truncated due to timeout)
        data = { error: t("providerTestFailed"), results: [], summary: null };
      }
      setTestResults({
        ...data,
        // Normalize error: if API returns an error object { message, details }, extract the string
        error: data.error
          ? typeof data.error === "object"
            ? data.error.message || data.error.error || JSON.stringify(data.error)
            : String(data.error)
          : null,
      });
      if (data?.summary) {
        const { passed, failed, total } = data.summary;
        if (failed === 0) notify.success(t("allTestsPassed", { total }));
        else notify.warning(t("testSummary", { passed, failed, total }));
      }
    } catch (error: any) {
      const isAbort = error?.name === "AbortError";
      const msg = isAbort ? t("providerTestTimeout") : t("providerTestFailed");
      setTestResults({ error: msg, results: [], summary: null });
      notify.error(msg);
    } finally {
      clearTimeout(timeoutId);
      setTestingMode(null);
    }
  };

  const compatibleProviders = providerNodes
    .filter((node) => node.type === "openai-compatible")
    .map((node) => ({
      id: node.id,
      name: node.name || t("openaiCompatibleName"),
      color: "#10A37F",
      textIcon: "OC",
      apiType: node.apiType,
    }));

  const anthropicCompatibleProviders = providerNodes
    .filter(
      (node) => node.type === "anthropic-compatible" && !isClaudeCodeCompatibleProvider(node.id)
    )
    .map((node) => ({
      id: node.id,
      name: node.name || t("anthropicCompatibleName"),
      color: "#D97757",
      textIcon: "AC",
    }));

  const ccCompatibleProviders = providerNodes
    .filter(
      (node) => node.type === "anthropic-compatible" && isClaudeCodeCompatibleProvider(node.id)
    )
    .map((node) => ({
      id: node.id,
      name: node.name || ccCompatibleLabel,
      color: "#B45309",
      textIcon: "CC",
    }));

  const oauthProviderEntriesAll = buildMergedOAuthProviderEntries(
    OAUTH_PROVIDERS,
    FREE_PROVIDERS,
    getProviderStats
  );
  const oauthProviderEntries = filterConfiguredProviderEntries(
    oauthProviderEntriesAll,
    showConfiguredOnly,
    searchQuery
  );

  const apiKeyProviderEntriesAll = buildStaticProviderEntries("apikey", getProviderStats);
  const llmProviderEntries = filterConfiguredProviderEntries(
    apiKeyProviderEntriesAll.filter(
      (entry) =>
        !IMAGE_ONLY_PROVIDER_IDS.has(entry.providerId) &&
        !AGGREGATOR_PROVIDER_IDS.has(entry.providerId) &&
        !ENTERPRISE_CLOUD_PROVIDER_IDS.has(entry.providerId) &&
        !VIDEO_PROVIDER_IDS.has(entry.providerId) &&
        !EMBEDDING_RERANK_PROVIDER_IDS.has(entry.providerId)
    ),
    showConfiguredOnly,
    searchQuery
  );
  const aggregatorProviderEntries = filterConfiguredProviderEntries(
    apiKeyProviderEntriesAll.filter((entry) => AGGREGATOR_PROVIDER_IDS.has(entry.providerId)),
    showConfiguredOnly,
    searchQuery
  );
  const imageProviderEntries = filterConfiguredProviderEntries(
    apiKeyProviderEntriesAll.filter((entry) => IMAGE_ONLY_PROVIDER_IDS.has(entry.providerId)),
    showConfiguredOnly,
    searchQuery
  );
  const enterpriseProviderEntries = filterConfiguredProviderEntries(
    apiKeyProviderEntriesAll.filter((entry) => ENTERPRISE_CLOUD_PROVIDER_IDS.has(entry.providerId)),
    showConfiguredOnly,
    searchQuery
  );
  const videoProviderEntries = filterConfiguredProviderEntries(
    apiKeyProviderEntriesAll.filter((entry) => VIDEO_PROVIDER_IDS.has(entry.providerId)),
    showConfiguredOnly,
    searchQuery
  );
  const embeddingRerankProviderEntries = filterConfiguredProviderEntries(
    apiKeyProviderEntriesAll.filter((entry) => EMBEDDING_RERANK_PROVIDER_IDS.has(entry.providerId)),
    showConfiguredOnly,
    searchQuery
  );

  const webCookieProviderEntriesAll = buildStaticProviderEntries("web-cookie", getProviderStats);
  const webCookieProviderEntries = filterConfiguredProviderEntries(
    webCookieProviderEntriesAll,
    showConfiguredOnly,
    searchQuery
  );

  const searchProviderEntriesAll = buildStaticProviderEntries("search", getProviderStats);
  const searchProviderEntries = filterConfiguredProviderEntries(
    searchProviderEntriesAll,
    showConfiguredOnly,
    searchQuery
  );

  const audioProviderEntriesAll = buildStaticProviderEntries("audio", getProviderStats);
  const audioProviderEntries = filterConfiguredProviderEntries(
    audioProviderEntriesAll,
    showConfiguredOnly,
    searchQuery
  );

  const cloudAgentProviderEntriesAll = buildStaticProviderEntries("cloud-agent", getProviderStats);
  const cloudAgentProviderEntries = filterConfiguredProviderEntries(
    cloudAgentProviderEntriesAll,
    showConfiguredOnly,
    searchQuery
  );

  const upstreamProxyEntriesAll = buildStaticProviderEntries("upstream-proxy", getProviderStats);
  const upstreamProxyEntries = filterConfiguredProviderEntries(
    upstreamProxyEntriesAll,
    showConfiguredOnly,
    searchQuery
  );

  const localProviderEntriesAll = buildStaticProviderEntries("local", getProviderStats);
  const localProviderEntries = filterConfiguredProviderEntries(
    localProviderEntriesAll,
    showConfiguredOnly,
    searchQuery
  );

  const compatibleProviderEntriesAll = [
    ...compatibleProviders.map((provider) => ({
      providerId: provider.id,
      provider,
      stats: getProviderStats(provider.id, "apikey"),
      displayAuthType: "compatible" as const,
      toggleAuthType: "apikey" as const,
    })),
    ...anthropicCompatibleProviders.map((provider) => ({
      providerId: provider.id,
      provider,
      stats: getProviderStats(provider.id, "apikey"),
      displayAuthType: "compatible" as const,
      toggleAuthType: "apikey" as const,
    })),
    ...ccCompatibleProviders.map((provider) => ({
      providerId: provider.id,
      provider,
      stats: getProviderStats(provider.id, "apikey"),
      displayAuthType: "compatible" as const,
      toggleAuthType: "apikey" as const,
    })),
  ];

  // ── Free Tier entries (subset of OAuth that have free tiers) ──────────
  const freeTierEntriesAll = buildProviderEntries(FREE_PROVIDERS, "oauth", "free", getProviderStats);
  const freeTierEntries = filterConfiguredProviderEntries(
    freeTierEntriesAll,
    showConfiguredOnly,
    searchQuery
  );

  // ── All entries with category tag for unified filtering ───────────────
  type CategorizedEntry = ProviderEntry & { _category: ProviderCategory };

  const allCategorizedEntriesRaw: CategorizedEntry[] = [
    ...oauthProviderEntriesAll.map((e) => ({ ...e, _category: "oauth" as const })),
    ...freeTierEntriesAll.map((e) => ({ ...e, _category: "free" as const })),
    ...upstreamProxyEntriesAll.map((e) => ({ ...e, _category: "upstream-proxy" as const })),
    ...apiKeyProviderEntriesAll
      .filter(
        (e) =>
          !IMAGE_ONLY_PROVIDER_IDS.has(e.providerId) &&
          !VIDEO_PROVIDER_IDS.has(e.providerId) &&
          !EMBEDDING_RERANK_PROVIDER_IDS.has(e.providerId) &&
          !AGGREGATOR_PROVIDER_IDS.has(e.providerId) &&
          !ENTERPRISE_CLOUD_PROVIDER_IDS.has(e.providerId)
      )
      .map((e) => ({ ...e, _category: "apikey" as const })),
    ...compatibleProviderEntriesAll.map((e) => ({ ...e, _category: "compatible" as const })),
    ...webCookieProviderEntriesAll.map((e) => ({ ...e, _category: "web-cookie" as const })),
    ...searchProviderEntriesAll.map((e) => ({ ...e, _category: "search" as const })),
    ...audioProviderEntriesAll.map((e) => ({ ...e, _category: "audio" as const })),
    ...localProviderEntriesAll.map((e) => ({ ...e, _category: "local" as const })),
    ...cloudAgentProviderEntriesAll.map((e) => ({ ...e, _category: "cloud-agent" as const })),
    ...apiKeyProviderEntriesAll
      .filter((e) => IMAGE_ONLY_PROVIDER_IDS.has(e.providerId))
      .map((e) => ({ ...e, _category: "image" as const })),
    ...apiKeyProviderEntriesAll
      .filter((e) => VIDEO_PROVIDER_IDS.has(e.providerId))
      .map((e) => ({ ...e, _category: "video" as const })),
    ...apiKeyProviderEntriesAll
      .filter((e) => EMBEDDING_RERANK_PROVIDER_IDS.has(e.providerId))
      .map((e) => ({ ...e, _category: "embedding" as const })),
    ...aggregatorProviderEntries.map((e) => ({ ...e, _category: "apikey" as const })),
    ...enterpriseProviderEntries.map((e) => ({ ...e, _category: "apikey" as const })),
  ];

  // Dedupe by providerId — first category wins (oauth > free > apikey etc.)
  const seenProviderIds = new Set<string>();
  const allCategorizedEntries = allCategorizedEntriesRaw.filter((e) => {
    if (seenProviderIds.has(e.providerId)) return false;
    seenProviderIds.add(e.providerId);
    return true;
  });

  // ── Summary stats for top card ─────────────────────────────────────────
  const countCat = (cat: string) => {
    const entries = allCategorizedEntries.filter((e) => e._category === cat);
    return {
      configured: entries.filter((e) => Number(e.stats?.total || 0) > 0).length,
      total: entries.length,
    };
  };

  const summaryStats: ProviderSummaryStats = {
    all: {
      configured: allCategorizedEntries.filter((e) => Number(e.stats?.total || 0) > 0).length,
      total: allCategorizedEntries.length,
    },
    oauth: countCat("oauth"),
    ide: countCat("ide"),
    free: countCat("free"),
    noauth: countCat("noauth"),
    "upstream-proxy": countCat("upstream-proxy"),
    apikey: countCat("apikey"),
    compatible: countCat("compatible"),
    "web-cookie": countCat("web-cookie"),
    search: countCat("search"),
    "web-fetch": countCat("web-fetch"),
    audio: countCat("audio"),
    local: countCat("local"),
    "cloud-agent": countCat("cloud-agent"),
  };

  // ── Filtered entries based on active category + display mode + media kind ──
  const filteredEntries = (() => {
    const effectiveShowConfiguredOnly = displayMode === "configured" || showConfiguredOnly;

    let base = allCategorizedEntries;
    if (activeCategory && activeCategory !== "all") {
      base = base.filter((e) => e._category === activeCategory);
    }

    if (activeMediaKind) {
      base = base.filter((e) => e._category === activeMediaKind);
    }

    let filtered = filterConfiguredProviderEntries(base, effectiveShowConfiguredOnly, searchQuery);

    if (modelSearchQuery && modelSearchQuery.trim()) {
      const q = modelSearchQuery.trim().toLowerCase();
      filtered = filtered.filter((e) => {
        const provider = e.provider as Record<string, unknown>;
        const models = (provider.models as string[]) || [];
        return models.some((m) => m.toLowerCase().includes(q));
      });
    }

    return filtered;
  })();

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ProviderSummaryCard
        activeCategory={activeCategory}
        activeMediaKind={activeMediaKind}
        onMediaKindChange={setActiveMediaKind}
        disabledConfigured={connections.length === 0}
        displayMode={displayMode}
        modelSearchQuery={modelSearchQuery}
        onBatchTest={handleBatchTest}
        onCategoryChange={(category, freeOnly) => {
          setShowFreeOnly(freeOnly);
          setActiveCategory(freeOnly ? null : category);
        }}
        onDisplayModeChange={setDisplayMode}
        onNewProvider={() => router.push("/dashboard/providers/new")}
        searchQuery={searchQuery}
        setModelSearchQuery={setModelSearchQuery}
        setSearchQuery={setSearchQuery}
        showFreeOnly={showFreeOnly}
        summaryStats={summaryStats}
        testingMode={testingMode}
      />

      {/* Expiration Banner */}
      {expirations?.summary &&
        (expirations.summary.expired > 0 || expirations.summary.expiringSoon > 0) && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 border ${
              expirations.summary.expired > 0
                ? "bg-red-500/10 border-red-500/20"
                : "bg-amber-500/10 border-amber-500/20"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[24px] ${
                expirations.summary.expired > 0 ? "text-red-500" : "text-amber-500"
              }`}
            >
              {expirations.summary.expired > 0 ? "error" : "warning"}
            </span>
            <div className="flex-1">
              <h3
                className={`font-semibold ${expirations.summary.expired > 0 ? "text-red-500" : "text-amber-500"}`}
              >
                {expirations.summary.expired > 0
                  ? t("expirationBannerExpired", { count: expirations.summary.expired })
                  : t("expirationBannerExpiringSoon", {
                      count: expirations.summary.expiringSoon,
                    })}
              </h3>
              <p className="text-sm mt-1 opacity-80 text-text-main">
                {expirations.summary.expired > 0
                  ? t("expirationBannerExpiredDesc")
                  : t("expirationBannerExpiringSoonDesc")}
              </p>
            </div>
          </div>
        )}

      {/* Provider Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold flex items-center gap-2 flex-1 min-w-0">
            {activeCategory === "all" || !activeCategory
              ? t("allProviders") || "All Providers"
              : activeCategory}
            <ProviderCountBadge
              configured={filteredEntries.filter((e) => Number(e.stats?.total || 0) > 0).length}
              total={filteredEntries.length}
            />
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleZedImport}
              disabled={importingZed}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-bg-subtle border-border text-text-muted hover:text-text-primary hover:border-primary/40"
              title={t("zedImportHint")}
            >
              <span
                className={`material-symbols-outlined text-[14px] ${importingZed ? "animate-spin" : ""}`}
              >
                {importingZed ? "sync" : "download"}
              </span>
              {importingZed ? t("zedImporting") : t("zedImportButton")}
            </button>
            {activeCategory === "compatible" && (
              <>
                <Button size="sm" icon="add" onClick={() => setShowAddCompatibleModal(true)}>
                  {t("addOpenAICompatible")}
                </Button>
                <Button size="sm" icon="add" onClick={() => setShowAddAnthropicCompatibleModal(true)}>
                  {t("addAnthropicCompatible")}
                </Button>
                {ccCompatibleProviderEnabled && (
                  <Button size="sm" icon="add" onClick={() => setShowAddCcCompatibleModal(true)}>
                    {addCcCompatibleLabel}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <span className="material-symbols-outlined text-[40px] text-text-muted mb-2 block">
              search_off
            </span>
            <p className="text-text-muted text-sm">
              {searchQuery || modelSearchQuery
                ? t("noProvidersFound") || "No providers match your search"
                : t("noProvidersInCategory") || "No providers in this category"}
            </p>
          </div>
        ) : (
          <div
            className={
              displayMode === "compact"
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            }
          >
            {filteredEntries.map(({ providerId, provider, stats, displayAuthType, toggleAuthType }) => (
              <ProviderCard
                key={providerId}
                providerId={providerId}
                provider={provider}
                stats={stats}
                authType={displayAuthType}
                onToggle={(active) => handleToggleProvider(providerId, toggleAuthType, active)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Compatible Provider Modals */}
      <AddCompatibleProviderModal
        isOpen={showAddCompatibleModal}
        mode="openai"
        onClose={() => setShowAddCompatibleModal(false)}
        onCreated={(node) => {
          setProviderNodes((prev) => [...prev, node]);
          setShowAddCompatibleModal(false);
          router.push(`/dashboard/providers/${node.id}`);
        }}
      />
      <AddCompatibleProviderModal
        isOpen={showAddAnthropicCompatibleModal}
        mode="anthropic"
        onClose={() => setShowAddAnthropicCompatibleModal(false)}
        onCreated={(node) => {
          setProviderNodes((prev) => [...prev, node]);
          setShowAddAnthropicCompatibleModal(false);
          router.push(`/dashboard/providers/${node.id}`);
        }}
      />
      {ccCompatibleProviderEnabled && (
        <AddCompatibleProviderModal
          isOpen={showAddCcCompatibleModal}
          mode="cc"
          title={addCcCompatibleLabel}
          onClose={() => setShowAddCcCompatibleModal(false)}
          onCreated={(node) => {
            setProviderNodes((prev) => [...prev, node]);
            setShowAddCcCompatibleModal(false);
            router.push(`/dashboard/providers/${node.id}`);
          }}
        />
      )}

      {/* Test Results Modal */}
      {testResults && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
          onClick={() => setTestResults(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-bg-primary border border-border rounded-xl w-full max-w-[600px] max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b border-border bg-bg-primary/95 backdrop-blur-sm rounded-t-xl">
              <h3 className="font-semibold">{t("testResults")}</h3>
              <button
                onClick={() => setTestResults(null)}
                className="p-1 rounded-lg hover:bg-bg-subtle text-text-muted hover:text-text-primary transition-colors"
                aria-label={tc("close")}
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="p-5">
              <ProviderTestResultsView results={testResults} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Provider Test Results View (mirrors combo TestResultsView) ──────────────

function ProviderTestResultsView({ results }: { results: ProviderBatchTestResults }) {
  const t = useTranslations("providers");
  const tc = useTranslations("common");
  const emailsVisible = useEmailPrivacyStore((s) => s.emailsVisible);

  // Guard: never crash on malformed/null results (would trigger error boundary)
  if (!results || typeof results !== "object") {
    return null;
  }

  if (results.error && (!results.results || results.results.length === 0)) {
    return (
      <div className="text-center py-6">
        <span className="material-symbols-outlined text-red-500 text-[32px] mb-2 block">error</span>
        <p className="text-sm text-red-400">
          {typeof results.error === "object"
            ? results.error?.message || JSON.stringify(results.error)
            : String(results.error)}
        </p>
      </div>
    );
  }

  const summary = results.summary ?? null;
  const mode = results.mode ?? "";
  const items = Array.isArray(results.results) ? results.results : [];

  const modeLabel =
    {
      oauth: t("oauthLabel"),
      free: tc("free"),
      apikey: t("apiKeyLabel"),
      compatible: t("compatibleLabel"),
      provider: t("providerLabel"),
      all: tc("all"),
    }[mode] || mode;

  return (
    <div className="flex flex-col gap-3">
      {/* Summary header */}
      {summary && (
        <div className="flex items-center gap-3 text-xs mb-1">
          <span className="text-text-muted">{t("modeTest", { mode: modeLabel })}</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium">
            {t("passedCount", { count: summary.passed })}
          </span>
          {summary.failed > 0 && (
            <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-medium">
              {t("failedCount", { count: summary.failed })}
            </span>
          )}
          <span className="text-text-muted ml-auto">
            {t("testedCount", { count: summary.total })}
          </span>
        </div>
      )}

      {/* Individual results */}
      {items.map((r, i) => (
        <div
          key={r.connectionId || i}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.03]"
        >
          <span
            className={`material-symbols-outlined text-[16px] ${
              r.valid ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {r.valid ? "check_circle" : "error"}
          </span>
          <div className="flex-1 min-w-0">
            <span className="font-medium">
              {pickDisplayValue([r.connectionName], emailsVisible, r.connectionName)}
            </span>
            <span className="text-text-muted ml-1.5">({r.provider})</span>
          </div>
          {r.latencyMs !== undefined && (
            <span className="text-text-muted font-mono tabular-nums">
              {t("millisecondsAbbr", { value: r.latencyMs })}
            </span>
          )}
          <span
            className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
              r.valid ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            }`}
          >
            {r.valid ? t("okShort") : r.diagnosis?.type || t("errorShort")}
          </span>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-4 text-text-muted text-sm">
          {t("noActiveConnectionsInGroup")}
        </div>
      )}
    </div>
  );
}
