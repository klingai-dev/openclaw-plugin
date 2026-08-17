export const KLING_MCP_SERVER_NAME = "Plugin-OpenClaw-kling-ai";

export const KLING_DEFAULT_REGION = "global";

export const KLING_MCP_REGIONS = Object.freeze({
  cn: Object.freeze({
    url: "https://klingai.com/mcp",
    authorizationHost: "klingai.com"
  }),
  global: Object.freeze({
    url: "https://kling.ai/mcp",
    authorizationHost: "kling.ai"
  })
});

export function normalizeKlingRegion(region = KLING_DEFAULT_REGION) {
  if (Object.hasOwn(KLING_MCP_REGIONS, region)) return region;
  throw new Error(`Unsupported Kling AI region "${region}". Use "cn" or "global".`);
}

export function findKlingRegionByUrl(value) {
  return Object.entries(KLING_MCP_REGIONS)
    .find(([, config]) => config.url === value)?.[0];
}

export function createKlingMcpServerConfig(region = KLING_DEFAULT_REGION) {
  const normalizedRegion = normalizeKlingRegion(region);
  return Object.freeze({
    url: KLING_MCP_REGIONS[normalizedRegion].url,
    transport: "streamable-http",
    auth: "oauth",
    headers: Object.freeze({
      "X-Kling-Integration": "Plugin-OpenClaw"
    }),
    connectionTimeoutMs: 30000,
    requestTimeoutMs: 60000,
    supportsParallelToolCalls: true
  });
}

export const KLING_MCP_SERVER_CONFIG = createKlingMcpServerConfig();
