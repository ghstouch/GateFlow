"use client";

import { Card, Input } from "@/shared/components";
import { CategoryDot } from "./CategoryDot";

type SummaryStat = {
  configured: number;
  total: number;
};

export interface ProviderSummaryStats {
  all: SummaryStat;
  oauth: SummaryStat;
  ide: SummaryStat;
  free: SummaryStat;
  noauth: SummaryStat;
  "upstream-proxy": SummaryStat;
  apikey: SummaryStat;
  compatible: SummaryStat;
  "web-cookie": SummaryStat;
  search: SummaryStat;
  "web-fetch": SummaryStat;
  audio: SummaryStat;
  local: SummaryStat;
  "cloud-agent": SummaryStat;
}

const MEDIA_KINDS = [
  { key: "image", icon: "image", label: "Image" },
  { key: "video", icon: "videocam", label: "Video" },
  { key: "music", icon: "music_note", label: "Music" },
  { key: "tts", icon: "record_voice_over", label: "Text→Speech" },
  { key: "stt", icon: "hearing", label: "Speech→Text" },
  { key: "embedding", icon: "scatter_plot", label: "Embedding" },
];

interface ProviderSummaryCardProps {
  activeCategory: string | null;
  activeMediaKind: string | null;
  onMediaKindChange: (kind: string | null) => void;
  disabledConfigured: boolean;
  displayMode: "all" | "configured" | "compact";
  modelSearchQuery: string;
  onBatchTest: (mode: string) => void;
  onCategoryChange: (category: string | null, freeOnly: boolean) => void;
  onDisplayModeChange: (mode: "all" | "configured" | "compact") => void;
  onNewProvider: () => void;
  searchQuery: string;
  setModelSearchQuery: (value: string) => void;
  setSearchQuery: (value: string) => void;
  showFreeOnly: boolean;
  summaryStats: ProviderSummaryStats;
  testingMode: string | null;
}

export default function ProviderSummaryCard({
  activeCategory,
  activeMediaKind,
  onMediaKindChange,
  disabledConfigured,
  displayMode,
  modelSearchQuery,
  onBatchTest,
  onCategoryChange,
  onDisplayModeChange,
  onNewProvider,
  searchQuery,
  setModelSearchQuery,
  setSearchQuery,
  showFreeOnly,
  summaryStats,
  testingMode,
}: ProviderSummaryCardProps) {
  const displayModeOptions = [
    { mode: "all" as const, icon: "view_module", label: "All" },
    { mode: "configured" as const, icon: "check_circle", label: "Configured", disabled: disabledConfigured },
    { mode: "compact" as const, icon: "view_agenda", label: "Compact" },
  ];

  const categories = [
    { key: null, color: null, label: "Total", stat: summaryStats.all },
    { key: "oauth", color: "#3b82f6", label: "OAuth", stat: summaryStats.oauth },
    { key: "ide", color: "#00D4AA", label: "IDE", stat: summaryStats.ide },
    { key: "free", color: "#22c55e", label: "Free Tier", stat: summaryStats.free },
    { key: "no-auth", color: "#6b7280", label: "No Auth", stat: summaryStats.noauth },
    { key: "upstream-proxy", color: "#6366f1", label: "Upstream Proxy", stat: summaryStats["upstream-proxy"] },
    { key: "apikey", color: "#f59e0b", label: "API Key", stat: summaryStats.apikey },
    { key: "compatible", color: "#f97316", label: "Compatible", stat: summaryStats.compatible },
    { key: "web-cookie", color: "#a855f7", label: "Web Cookie", stat: summaryStats["web-cookie"] },
    { key: "search", color: "#14b8a6", label: "Search", stat: summaryStats.search },
    { key: "web-fetch", color: "#06b6d4", label: "Web Fetch", stat: summaryStats["web-fetch"] },
    { key: "audio", color: "#f43f5e", label: "Audio", stat: summaryStats.audio },
    { key: "local", color: "#4A148C", label: "Local", stat: summaryStats.local },
    { key: "cloud-agent", color: "#8b5cf6", label: "Cloud Agent", stat: summaryStats["cloud-agent"] },
  ].filter((category) => category.key !== "no-auth" || category.stat.total > 0);

  return (
    <Card padding="sm">
      <div className="flex flex-col gap-3">
        {/* Row 1: Search + Display Mode + Onboarding Wizard */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Providers"
              aria-label="Search providers"
              icon="search"
              inputClassName={searchQuery ? "pr-9" : ""}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-text-muted hover:text-text-primary transition-colors"
                aria-label="Clear"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
          <div className="relative flex-1 min-w-[160px]">
            <Input
              value={modelSearchQuery}
              onChange={(e) => setModelSearchQuery(e.target.value)}
              placeholder="Search by model..."
              aria-label="Search by model"
              icon="psychology"
              inputClassName={modelSearchQuery ? "pr-9" : ""}
            />
            {modelSearchQuery && (
              <button
                onClick={() => setModelSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-text-muted hover:text-text-primary transition-colors"
                aria-label="Clear"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
          <div
            className="flex items-center rounded-lg border border-border bg-bg-subtle p-0.5"
            role="radiogroup"
            aria-label="Provider display mode"
          >
            {displayModeOptions.map((option) => {
              const isActive = displayMode === option.mode;
              return (
                <label
                  key={option.mode}
                  title={option.mode === "all" ? "Show every provider in grouped sections." : option.mode === "configured" ? "Show providers with saved connections." : "Show configured and no-auth providers once in a single flat list."}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-bg-primary text-text-main shadow-sm"
                      : "text-text-muted hover:bg-bg-primary/70 hover:text-text-main"
                  } ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input
                    type="radio"
                    name="provider-display-mode"
                    value={option.mode}
                    checked={isActive}
                    disabled={option.disabled}
                    onChange={() => onDisplayModeChange(option.mode)}
                    className="sr-only"
                  />
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                    {option.icon}
                  </span>
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
          <button
            onClick={onNewProvider}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Onboarding Wizard
          </button>
        </div>

        {/* Row 2: Test All */}
        <div className="flex items-center">
          <button
            onClick={() => onBatchTest("all")}
            disabled={!!testingMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              testingMode === "all"
                ? "bg-primary/20 border-primary/40 text-primary animate-pulse"
                : "bg-bg-subtle border-border text-text-muted hover:text-text-primary hover:border-primary/40"
            }`}
            title="Test all providers"
          >
            <span className="material-symbols-outlined text-[14px]">
              {testingMode === "all" ? "sync" : "play_arrow"}
            </span>
            {testingMode === "all" ? "Testing..." : "Test All"}
          </button>
        </div>

        {/* Row 3-5: Category Filter Chips */}
        <div className="border-t border-border pt-3 flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const isActive =
              (cat.key === null && !activeCategory && !showFreeOnly) ||
              (cat.key === "free" && showFreeOnly) ||
              (cat.key !== "free" && cat.key !== null && !showFreeOnly && activeCategory === cat.key);
            return (
              <button
                key={cat.key ?? "all"}
                onClick={() => onCategoryChange(cat.key, cat.key === "free")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white border-primary"
                    : "bg-bg-subtle border-border text-text-muted hover:text-text-primary hover:border-primary/30"
                }`}
              >
                {cat.color && <CategoryDot color={cat.color} label={cat.label} />}
                <span>{cat.label}</span>
                <span className={`text-[11px] ${isActive ? "text-white/80" : "text-text-muted"}`}>
                  {cat.stat.configured}
                  <span className="opacity-70">/{cat.stat.total}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 6: Media Filter Chips */}
        <div className="border-t border-border pt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted mr-1">
            Media
          </span>
          {MEDIA_KINDS.map((chip) => {
            const isActive = activeMediaKind === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => onMediaKindChange(isActive ? null : chip.key)}
                aria-pressed={isActive}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white border-primary"
                    : "bg-bg-subtle border-border text-text-muted hover:text-text-primary hover:border-primary/30"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}
          {activeMediaKind && (
            <button
              onClick={() => onMediaKindChange(null)}
              className="text-[11px] text-text-muted hover:text-text-primary underline-offset-2 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
