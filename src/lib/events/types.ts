export type DashboardEventName =
  | "request.started"
  | "request.streaming"
  | "request.completed"
  | "request.failed"
  | "combo.target.attempt"
  | "combo.target.failed"
  | "combo.target.succeeded"
  | "credential.health.changed"
  | "compression.completed"
  | "compression.step";

export interface RequestStartedPayload {
  id: string;
  model: string;
  provider: string;
  timestamp: number;
  comboName?: string;
}

export interface RequestStreamingPayload {
  id: string;
  tokensGenerated: number;
  elapsedMs: number;
}

export interface RequestCompletedPayload {
  id: string;
  status: "success" | "error";
  model: string;
  provider: string;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
  comboName?: string;
  error?: string;
}

export interface RequestFailedPayload {
  id: string;
  error: string;
  statusCode?: number;
  latencyMs: number;
  model?: string;
  provider?: string;
}

export interface ComboTargetAttemptPayload {
  comboName: string;
  targetIndex: number;
  provider: string;
  model: string;
  timestamp: number;
  strategy: string;
}

export interface ComboTargetFailedPayload {
  comboName: string;
  targetIndex: number;
  provider: string;
  model: string;
  error: string;
  latencyMs: number;
}

export interface ComboTargetSucceededPayload {
  comboName: string;
  targetIndex: number;
  provider: string;
  model: string;
  latencyMs: number;
}

export interface CredentialHealthChangedPayload {
  connectionId: string;
  provider: string;
  oldStatus: string;
  newStatus: string;
  timestamp: number;
}

export interface CompressionCompletedPayload {
  requestId: string;
  comboId: string | null;
  mode: string;
  originalTokens: number;
  compressedTokens: number;
  savingsPercent: number;
  engineBreakdown: Array<{
    engine: string;
    originalTokens: number;
    compressedTokens: number;
    savingsPercent: number;
    techniquesUsed: string[];
    rulesApplied?: string[];
    durationMs?: number;
  }>;
  validationWarnings?: string[];
  fallbackApplied?: boolean;
  timestamp: number;
}

export interface CompressionStepPayload {
  requestId: string;
  comboId: string | null;
  mode: string;
  stepIndex: number;
  totalSteps: number;
  engine: string;
  state: "running" | "done" | "skipped";
  originalTokens: number;
  compressedTokens: number;
  savingsPercent: number;
  techniquesUsed?: string[];
  rulesApplied?: string[];
  durationMs?: number;
  timestamp: number;
}

export interface DashboardEventMap {
  "request.started": RequestStartedPayload;
  "request.streaming": RequestStreamingPayload;
  "request.completed": RequestCompletedPayload;
  "request.failed": RequestFailedPayload;
  "combo.target.attempt": ComboTargetAttemptPayload;
  "combo.target.failed": ComboTargetFailedPayload;
  "combo.target.succeeded": ComboTargetSucceededPayload;
  "credential.health.changed": CredentialHealthChangedPayload;
  "compression.completed": CompressionCompletedPayload;
  "compression.step": CompressionStepPayload;
}

export type DashboardEventListener<E extends DashboardEventName> = (payload: DashboardEventMap[E]) => void;

export type DashboardChannel = "requests" | "combo" | "credentials" | "compression";

export const CHANNEL_EVENTS: Record<DashboardChannel, DashboardEventName[]> = {
  requests: ["request.started", "request.streaming", "request.completed", "request.failed"],
  combo: ["combo.target.attempt", "combo.target.failed", "combo.target.succeeded"],
  credentials: ["credential.health.changed"],
  compression: ["compression.completed", "compression.step"],
};

export function getChannelForEvent(event: DashboardEventName): DashboardChannel | undefined {
  for (const [channel, events] of Object.entries(CHANNEL_EVENTS)) {
    if (events.includes(event)) return channel as DashboardChannel;
  }
  return undefined;
}
