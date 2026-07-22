/**
 * Compatibility re-export — the canonical module was renamed to
 * resolveGateFlowBaseUrl.ts.  Legacy callers (open-sse/) still import
 * from this path.
 */
export { resolveGateFlowBaseUrl as resolveOmniRouteBaseUrl } from "./resolveGateFlowBaseUrl";
