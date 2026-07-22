const PUBLIC_API_ROUTE_PREFIXES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/status",
  "/api/init",
  "/api/v1/",
  "/api/sync/bundle",
  "/api/oauth/",
  "/api/codex/connect/",
  "/api/cli/connect",
  "/api/usage/om-usage",
  "/api/skills/collect/chaos",
];

const PUBLIC_READONLY_API_ROUTE_PREFIXES = [
  "/api/health/ping",
  "/api/monitoring/health",
  "/api/settings/require-login",
];

const PUBLIC_READONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const PUBLIC_CLOUD_API_ROUTES = [
  { path: "/api/cloud/auth", methods: new Set(["POST", "OPTIONS"]) },
  { path: "/api/cloud/model/resolve", methods: new Set(["POST", "OPTIONS"]) },
  { path: "/api/cloud/models/alias", methods: new Set(["GET", "HEAD", "OPTIONS"]) },
];

function pathMatchesExactRoute(pathname: string, routePath: string): boolean {
  return pathname === routePath || pathname === `${routePath}/`;
}

function isPublicCloudApiRoute(pathname: string, method: string): boolean {
  const normalizedMethod = String(method).toUpperCase();
  return PUBLIC_CLOUD_API_ROUTES.some(
    ({ path, methods }) => pathMatchesExactRoute(pathname, path) && methods.has(normalizedMethod)
  );
}

export function isPublicApiRoute(pathname: string, method = "GET"): boolean {
  if (isPublicCloudApiRoute(pathname, method)) {
    return true;
  }

  if (PUBLIC_API_ROUTE_PREFIXES.some((route) => pathname.startsWith(route))) {
    return true;
  }

  if (!PUBLIC_READONLY_METHODS.has(String(method).toUpperCase())) {
    return false;
  }

  return PUBLIC_READONLY_API_ROUTE_PREFIXES.some((route) => pathname.startsWith(route));
}

export { PUBLIC_API_ROUTE_PREFIXES, PUBLIC_READONLY_API_ROUTE_PREFIXES, PUBLIC_READONLY_METHODS };
