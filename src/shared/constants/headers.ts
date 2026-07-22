export const OMNIROUTE_RESPONSE_HEADERS = {
  cache: "X-GateFlow-Cache",
  cacheHit: "X-GateFlow-Cache-Hit",
  latencyMs: "X-GateFlow-Latency-Ms",
  model: "X-GateFlow-Model",
  progress: "X-GateFlow-Progress",
  provider: "X-GateFlow-Provider",
  responseCost: "X-GateFlow-Response-Cost",
  tokensIn: "X-GateFlow-Tokens-In",
  tokensOut: "X-GateFlow-Tokens-Out",
} as const;
