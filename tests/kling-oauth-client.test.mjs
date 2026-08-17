import assert from "node:assert/strict";
import test from "node:test";

import {
  authorizeKlingOAuth,
  buildKlingAuthorizationUrl,
  createKlingOAuthRegistration,
  KLING_OAUTH_CLIENT_NAME,
  KLING_OAUTH_PROFILE_IDS,
  refreshKlingOAuthCredential,
  registerKlingOAuthClient
} from "../dist/kling-oauth-client.mjs";

test("registers the plugin as OpenClaw-Plugin without changing generic OpenClaw MCP", async () => {
  let request;
  const client = await registerKlingOAuthClient("global", async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({ client_id: "plugin-client" }), { status: 201 });
  });

  assert.equal(client.client_id, "plugin-client");
  assert.equal(request.url, "https://kling.ai/auth/register");
  assert.equal(request.init.headers["X-Kling-Integration"], "Plugin-OpenClaw");
  const registration = JSON.parse(request.init.body);
  assert.equal(registration.client_name, KLING_OAUTH_CLIENT_NAME);
  assert.equal(registration.client_name, "OpenClaw-Plugin");
  assert.equal(registration.application_type, "native");
  assert.doesNotMatch(JSON.stringify(registration), /OpenClaw MCP/u);
});

test("uses the China authorization service only for the China account site", () => {
  assert.equal(createKlingOAuthRegistration("cn").client_name, "OpenClaw-Plugin");
  const url = new URL(buildKlingAuthorizationUrl({
    region: "cn",
    clientId: "client-cn",
    state: "state-cn",
    codeChallenge: "challenge-cn"
  }));
  assert.equal(url.origin, "https://klingai.com");
  assert.equal(url.pathname, "/auth/authorize");
  assert.equal(url.searchParams.get("resource"), "https://klingai.com/mcp");
});

test("completes plugin OAuth and returns a refreshable OpenClaw auth profile credential", async () => {
  const requests = [];
  const opened = [];
  const credential = await authorizeKlingOAuth({
    region: "global",
    openUrl: async (url) => opened.push(url),
    createCallback: () => ({
      ready: Promise.resolve(),
      result: Promise.resolve("authorization-code"),
      close() {}
    }),
    stdout: { write() {} },
    fetchFn: async (url, init) => {
      requests.push({ url, init });
      if (url.endsWith("/register")) {
        return new Response(JSON.stringify({ client_id: "plugin-client" }), { status: 201 });
      }
      return new Response(JSON.stringify({
        access_token: "access-token",
        refresh_token: "refresh-token",
        expires_in: 3600
      }), { status: 200 });
    }
  });

  assert.equal(requests.length, 2);
  assert.equal(requests[1].url, "https://kling.ai/auth/token");
  assert.equal(requests[1].init.body.get("code"), "authorization-code");
  assert.equal(new URL(opened[0]).searchParams.get("client_id"), "plugin-client");
  assert.equal(credential.clientId, "plugin-client");
  assert.equal(credential.enterpriseUrl, "https://kling.ai/auth");
  assert.equal(credential.accountId, "global");
  assert.equal(KLING_OAUTH_PROFILE_IDS.global, "kling-ai-mcp:global");
});

test("refreshes only against the credential's matching official Kling service", async () => {
  let request;
  const credential = {
    type: "oauth",
    provider: "kling-ai-mcp",
    access: "old-access",
    refresh: "old-refresh",
    expires: 0,
    clientId: "plugin-client",
    enterpriseUrl: "https://kling.ai/auth",
    accountId: "global"
  };
  const refreshed = await refreshKlingOAuthCredential(credential, async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({
      access_token: "new-access",
      expires_in: 7200
    }), { status: 200 });
  });

  assert.equal(request.url, "https://kling.ai/auth/token");
  assert.equal(request.init.body.get("refresh_token"), "old-refresh");
  assert.equal(refreshed.access, "new-access");
  assert.equal(refreshed.refresh, "old-refresh");

  await assert.rejects(
    refreshKlingOAuthCredential({ ...credential, enterpriseUrl: "https://evil.example/auth" }),
    /official Kling authorization service/u
  );
});
