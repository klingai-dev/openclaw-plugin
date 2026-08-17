import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";

import {
  KLING_MCP_REGIONS,
  normalizeKlingRegion
} from "./kling-mcp-config.mjs";

export const KLING_OAUTH_CLIENT_NAME = "OpenClaw-Plugin";
export const KLING_OAUTH_PROVIDER_ID = "kling-ai-mcp";
export const KLING_OAUTH_REDIRECT_URL = "http://127.0.0.1:8989/oauth/callback";
export const KLING_OAUTH_SCOPE = "generation.create generation.read account.credit.read";
export const KLING_OAUTH_PROFILE_IDS = Object.freeze({
  global: `${KLING_OAUTH_PROVIDER_ID}:global`,
  cn: `${KLING_OAUTH_PROVIDER_ID}:cn`
});

const CALLBACK_TIMEOUT_MS = 5 * 60 * 1000;

function oauthEndpoints(region) {
  const normalizedRegion = normalizeKlingRegion(region);
  const origin = new URL(KLING_MCP_REGIONS[normalizedRegion].url).origin;
  return Object.freeze({
    region: normalizedRegion,
    resource: KLING_MCP_REGIONS[normalizedRegion].url,
    issuer: `${origin}/auth`,
    registration: `${origin}/auth/register`,
    authorization: `${origin}/auth/authorize`,
    token: `${origin}/auth/token`
  });
}

function pkcePair() {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

async function readJsonResponse(response, label) {
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${label} returned an invalid JSON response.`);
  }
  if (!response.ok) {
    const detail = typeof body?.error_description === "string"
      ? body.error_description
      : typeof body?.error === "string" ? body.error : `HTTP ${response.status}`;
    throw new Error(`${label} failed: ${detail}`);
  }
  return body;
}

function pluginHeaders(extra = {}) {
  return {
    "X-Kling-Integration": "Plugin-OpenClaw",
    ...extra
  };
}

export function createKlingOAuthRegistration(region) {
  normalizeKlingRegion(region);
  return {
    client_name: KLING_OAUTH_CLIENT_NAME,
    redirect_uris: [KLING_OAUTH_REDIRECT_URL],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    application_type: "native",
    token_endpoint_auth_method: "none",
    scope: KLING_OAUTH_SCOPE
  };
}

export async function registerKlingOAuthClient(region, fetchFn = fetch) {
  const endpoints = oauthEndpoints(region);
  const response = await fetchFn(endpoints.registration, {
    method: "POST",
    headers: pluginHeaders({ "content-type": "application/json" }),
    body: JSON.stringify(createKlingOAuthRegistration(region))
  });
  const client = await readJsonResponse(response, "Kling OAuth client registration");
  if (typeof client?.client_id !== "string" || client.client_id.length === 0) {
    throw new Error("Kling OAuth client registration did not return a client_id.");
  }
  return client;
}

export function buildKlingAuthorizationUrl({ region, clientId, state, codeChallenge }) {
  const endpoints = oauthEndpoints(region);
  const url = new URL(endpoints.authorization);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", KLING_OAUTH_REDIRECT_URL);
  url.searchParams.set("scope", KLING_OAUTH_SCOPE);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("resource", endpoints.resource);
  return url.href;
}

function callbackHtml(success, message) {
  const title = success ? "Kling AI authorization complete" : "Kling AI authorization failed";
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>${title}</title>` +
    `<body><h1>${title}</h1><p>${message}</p></body></html>`;
}

export function createKlingOAuthCallback({ state, timeoutMs = CALLBACK_TIMEOUT_MS } = {}) {
  let settle;
  const result = new Promise((resolve, reject) => {
    settle = { resolve, reject };
  });
  let timer;
  let settled = false;

  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", KLING_OAUTH_REDIRECT_URL);
    if (request.method !== "GET" || requestUrl.pathname !== "/oauth/callback") {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const returnedState = requestUrl.searchParams.get("state");
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");
    if (returnedState !== state) {
      response.writeHead(400, { "content-type": "text/html; charset=utf-8" });
      response.end(callbackHtml(false, "The OAuth state did not match. Return to the terminal and retry."));
      finish(new Error("Kling OAuth callback state mismatch."));
      return;
    }
    if (error || !code) {
      response.writeHead(400, { "content-type": "text/html; charset=utf-8" });
      response.end(callbackHtml(false, "Authorization was not completed. Return to the terminal and retry."));
      finish(new Error(`Kling OAuth authorization failed: ${error ?? "missing authorization code"}`));
      return;
    }

    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(callbackHtml(true, "You can close this window and return to OpenClaw."));
    finish(null, code);
  });

  function finish(error, code) {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    if (server.listening) server.close();
    if (error) settle.reject(error);
    else settle.resolve(code);
  }

  const ready = new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(8989, "127.0.0.1", () => {
      server.off("error", reject);
      timer = setTimeout(() => finish(new Error("Kling OAuth authorization timed out.")), timeoutMs);
      timer.unref?.();
      resolve();
    });
  });

  return {
    ready,
    result,
    close() {
      finish(new Error("Kling OAuth authorization was cancelled."));
    }
  };
}

async function exchangeKlingAuthorizationCode({ region, client, code, verifier, fetchFn }) {
  const endpoints = oauthEndpoints(region);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: KLING_OAUTH_REDIRECT_URL,
    client_id: client.client_id,
    code_verifier: verifier,
    resource: endpoints.resource
  });
  if (typeof client.client_secret === "string" && client.client_secret.length > 0) {
    body.set("client_secret", client.client_secret);
  }
  const response = await fetchFn(endpoints.token, {
    method: "POST",
    headers: pluginHeaders({ "content-type": "application/x-www-form-urlencoded" }),
    body
  });
  return readJsonResponse(response, "Kling OAuth token exchange");
}

function credentialFromTokenResponse({ region, client, tokens }) {
  if (typeof tokens?.access_token !== "string" || tokens.access_token.length === 0) {
    throw new Error("Kling OAuth token exchange did not return an access token.");
  }
  if (typeof tokens?.refresh_token !== "string" || tokens.refresh_token.length === 0) {
    throw new Error("Kling OAuth token exchange did not return a refresh token.");
  }
  const endpoints = oauthEndpoints(region);
  const expiresIn = Number(tokens.expires_in);
  const expires = Date.now() + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600) * 1000;
  return {
    access: tokens.access_token,
    refresh: tokens.refresh_token,
    expires,
    clientId: client.client_id,
    ...(typeof client.client_secret === "string" && client.client_secret.length > 0
      ? { clientSecret: client.client_secret }
      : {}),
    enterpriseUrl: endpoints.issuer,
    accountId: endpoints.region
  };
}

export async function authorizeKlingOAuth({
  region,
  fetchFn = fetch,
  openUrl,
  createCallback = createKlingOAuthCallback,
  stdout = process.stdout
}) {
  const normalizedRegion = normalizeKlingRegion(region);
  const client = await registerKlingOAuthClient(normalizedRegion, fetchFn);
  const state = randomBytes(32).toString("base64url");
  const { verifier, challenge } = pkcePair();
  const callback = createCallback({ state });
  try {
    await callback.ready;
    const authorizationUrl = buildKlingAuthorizationUrl({
      region: normalizedRegion,
      clientId: client.client_id,
      state,
      codeChallenge: challenge
    });
    stdout.write(`Opening Kling AI authorization for ${KLING_OAUTH_CLIENT_NAME}.\n`);
    await openUrl(authorizationUrl);
    const code = await callback.result;
    const tokens = await exchangeKlingAuthorizationCode({
      region: normalizedRegion,
      client,
      code,
      verifier,
      fetchFn
    });
    return credentialFromTokenResponse({ region: normalizedRegion, client, tokens });
  } finally {
    if (typeof callback.close === "function") callback.close();
    await Promise.resolve(callback.result).catch(() => {});
  }
}

export async function refreshKlingOAuthCredential(credential, fetchFn = fetch) {
  const region = credential?.accountId;
  const endpoints = oauthEndpoints(region);
  if (credential.enterpriseUrl !== endpoints.issuer) {
    throw new Error("Kling OAuth credential issuer is not an official Kling authorization service.");
  }
  if (typeof credential.refresh !== "string" || credential.refresh.length === 0) {
    throw new Error("Kling OAuth credential does not contain a refresh token.");
  }
  if (typeof credential.clientId !== "string" || credential.clientId.length === 0) {
    throw new Error("Kling OAuth credential does not contain a client id.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: credential.refresh,
    client_id: credential.clientId,
    resource: endpoints.resource
  });
  if (typeof credential.clientSecret === "string" && credential.clientSecret.length > 0) {
    body.set("client_secret", credential.clientSecret);
  }
  const response = await fetchFn(endpoints.token, {
    method: "POST",
    headers: pluginHeaders({ "content-type": "application/x-www-form-urlencoded" }),
    body
  });
  const tokens = await readJsonResponse(response, "Kling OAuth token refresh");
  const next = credentialFromTokenResponse({
    region,
    client: {
      client_id: credential.clientId,
      client_secret: credential.clientSecret
    },
    tokens: {
      ...tokens,
      refresh_token: tokens.refresh_token ?? credential.refresh
    }
  });
  return { ...credential, ...next };
}
