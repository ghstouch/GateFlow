export function deriveLiveWsPath(publicUrl?: string): string {
  if (!publicUrl) return "/live-ws";
  if (!publicUrl.startsWith("ws://") && !publicUrl.startsWith("wss://")) return "/live-ws";
  try {
    const parsed = new URL(publicUrl);
    const pathname = parsed.pathname;
    return pathname && pathname !== "/" ? pathname : "/live-ws";
  } catch {
    return "/live-ws";
  }
}

export function getLiveWsPath(): string {
  return deriveLiveWsPath(process.env.NEXT_PUBLIC_LIVE_WS_PUBLIC_URL);
}
