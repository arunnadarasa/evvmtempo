/** Paths are joined with the dev proxy or production origin in `paywallUrl`. */
export const PURL_PATHS = {
  free: "/test/free",
  paid: "/test/paid",
} as const;

export const MPP_PATHS = {
  pingPaid: "/api/ping/paid",
} as const;

/** Parallel gateway — MPP + Tempo mainnet (4217), PathUSD. */
export const PARALLEL_PATHS = {
  search: "/api/search",
} as const;

/**
 * In dev, Vite proxies third-party origins to avoid browser CORS.
 * In production builds, calls go directly (may fail without a same-origin proxy — see UI copy).
 */
export function paywallUrl(path: string, kind: "purl" | "mpp" | "parallel"): string {
  if (import.meta.env.DEV) {
    const prefix =
      kind === "purl" ? "/purl-dev" : kind === "mpp" ? "/mpp-dev" : "/parallel-dev";
    return `${prefix}${path}`;
  }
  const origin =
    kind === "purl" ? "https://www.purl.dev" : kind === "mpp" ? "https://mpp.dev" : "https://parallelmpp.dev";
  return `${origin}${path}`;
}
