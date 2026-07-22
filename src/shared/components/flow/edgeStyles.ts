import { STATUS_HEX } from "@/shared/constants/statusColors";

export const FLOW_EDGE_COLORS = {
  active: STATUS_HEX.success,
  error: STATUS_HEX.error,
  last: STATUS_HEX.warning,
  idle: "var(--color-text-muted)",
} as const;

export interface FlowEdgeStyle {
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export function edgeStyle(
  active: boolean,
  last: boolean,
  error: boolean,
  healthy = false
): FlowEdgeStyle {
  if (error) return { stroke: FLOW_EDGE_COLORS.error, strokeWidth: 2, opacity: 0.85 };
  if (active) return { stroke: FLOW_EDGE_COLORS.active, strokeWidth: 2.5, opacity: 1 };
  if (last) return { stroke: FLOW_EDGE_COLORS.last, strokeWidth: 1.5, opacity: 0.6 };
  if (healthy) return { stroke: FLOW_EDGE_COLORS.active, strokeWidth: 1.5, opacity: 0.4 };
  return { stroke: FLOW_EDGE_COLORS.idle, strokeWidth: 1, opacity: 0.3 };
}
