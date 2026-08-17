import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";

import {
  createKlingMcpServerConfig,
  KLING_MCP_SERVER_CONFIG,
  KLING_MCP_SERVER_NAME
} from "../dist/kling-mcp-config.mjs";
import { KLING_OAUTH_PROFILE_IDS } from "../dist/kling-oauth-client.mjs";
import {
  runKlingLogin,
  runKlingLogout,
  runKlingStatus,
  runKlingUse,
  shouldRecommendChinaRegion
} from "../dist/oauth-login.mjs";

function oauthDependencies(regions = []) {
  return {
    authorize: async ({ region }) => {
      regions.push(region);
      return {
        access: "test-access",
        refresh: "test-refresh",
        expires: Date.now() + 3600_000,
        clientId: "plugin-client",
        enterpriseUrl: region === "global" ? "https://kling.ai/auth" : "https://klingai.com/auth",
        accountId: region
      };
    },
    saveCredentials: async ({ region }) => KLING_OAUTH_PROFILE_IDS[region]
  };
}

function commandChild(args, calls, configuredServer) {
  calls.push(args);
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  queueMicrotask(() => {
    if (args[2] === "show") {
      if (configuredServer) child.stdout.write(JSON.stringify(configuredServer));
      else {
        child.stderr.write(`No MCP server named "${KLING_MCP_SERVER_NAME}"\n`);
        child.emit("exit", 1, null);
        return;
      }
    }
    child.emit("exit", 0, null);
  });
  return child;
}

test("builds the official MCP configuration for each region", () => {
  assert.equal(KLING_MCP_SERVER_CONFIG.url, "https://kling.ai/mcp");
  assert.equal(createKlingMcpServerConfig("cn").url, "https://klingai.com/mcp");
  assert.equal(createKlingMcpServerConfig("global").url, "https://kling.ai/mcp");
  assert.deepEqual(
    createKlingMcpServerConfig("global", { authProfileId: KLING_OAUTH_PROFILE_IDS.global }).oauth,
    { authProfileId: "kling-ai-mcp:global" }
  );
  assert.throws(() => createKlingMcpServerConfig("unknown"), /https:\/\/kling\.ai\/.*https:\/\/klingai\.com\/app/u);
});

test("recommends China without changing the global default", () => {
  assert.equal(shouldRecommendChinaRegion({ locale: "zh-CN", timeZone: "UTC" }), true);
  assert.equal(shouldRecommendChinaRegion({ locale: "zh-Hans-CN", timeZone: "UTC" }), true);
  assert.equal(shouldRecommendChinaRegion({ locale: "en-US", timeZone: "Asia/Shanghai" }), true);
  assert.equal(shouldRecommendChinaRegion({ locale: "en-US", timeZone: "America/Los_Angeles" }), false);
  assert.equal(KLING_MCP_SERVER_CONFIG.url, "https://kling.ai/mcp");
});

test("authorizes as the plugin and creates an auth-profile-backed MCP server", async () => {
  const calls = [];
  const regions = [];
  const result = await runKlingLogin({
    ...oauthDependencies(regions),
    spawnFn: (_command, args) => commandChild(args, calls),
    openUrl: async () => {},
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(result, 0);
  assert.deepEqual(regions, ["global"]);
  assert.deepEqual(calls.map((args) => args.slice(1, 3)), [
    ["mcp", "show"],
    ["mcp", "set"]
  ]);
  const setCall = calls.find((args) => args[2] === "set");
  assert.equal(setCall[3], KLING_MCP_SERVER_NAME);
  assert.deepEqual(
    JSON.parse(setCall[4]),
    createKlingMcpServerConfig("global", { authProfileId: KLING_OAUTH_PROFILE_IDS.global })
  );
  assert.doesNotMatch(JSON.stringify(calls), /\["mcp","login"\]/u);
});

test("preserves an existing official operator definition while binding plugin OAuth", async () => {
  const calls = [];
  const configured = {
    ...KLING_MCP_SERVER_CONFIG,
    connectionTimeoutMs: 45000,
    headers: {
      ...KLING_MCP_SERVER_CONFIG.headers,
      "X-Operator-Setting": "preserved"
    }
  };
  const result = await runKlingLogin({
    ...oauthDependencies(),
    spawnFn: (_command, args) => commandChild(args, calls, configured),
    openUrl: async () => {},
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(result, 0);
  assert.deepEqual(calls.map((args) => args.slice(1, 3)), [
    ["mcp", "show"],
    ["mcp", "logout"],
    ["mcp", "set"]
  ]);
  const saved = JSON.parse(calls.find((args) => args[2] === "set")[4]);
  assert.equal(saved.connectionTimeoutMs, 45000);
  assert.equal(saved.headers["X-Operator-Setting"], "preserved");
  assert.equal(saved.oauth.authProfileId, KLING_OAUTH_PROFILE_IDS.global);
});

test("keeps the configured China account site when login has no region option", async () => {
  const calls = [];
  const regions = [];
  const result = await runKlingLogin({
    ...oauthDependencies(regions),
    spawnFn: (_command, args) => commandChild(args, calls, createKlingMcpServerConfig("cn")),
    openUrl: async () => {},
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(result, 0);
  assert.deepEqual(regions, ["cn"]);
  const saved = JSON.parse(calls.find((args) => args[2] === "set")[4]);
  assert.equal(saved.url, "https://klingai.com/mcp");
  assert.equal(saved.oauth.authProfileId, KLING_OAUTH_PROFILE_IDS.cn);
});

test("switches official account sites only after the new plugin authorization succeeds", async () => {
  const calls = [];
  const regions = [];
  const result = await runKlingLogin({
    ...oauthDependencies(regions),
    region: "cn",
    spawnFn: (_command, args) => commandChild(args, calls, KLING_MCP_SERVER_CONFIG),
    openUrl: async () => {},
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(result, 0);
  assert.deepEqual(regions, ["cn"]);
  assert.deepEqual(calls.map((args) => args.slice(1, 3)), [
    ["mcp", "show"],
    ["mcp", "logout"],
    ["mcp", "set"]
  ]);
  const saved = JSON.parse(calls.find((args) => args[2] === "set")[4]);
  assert.deepEqual(saved, createKlingMcpServerConfig("cn", { authProfileId: KLING_OAUTH_PROFILE_IDS.cn }));
});

test("prints a China recommendation but authorizes international by default", async () => {
  const calls = [];
  const output = new PassThrough();
  let outputText = "";
  output.on("data", (chunk) => {
    outputText += chunk.toString();
  });

  const result = await runKlingLogin({
    ...oauthDependencies(),
    locale: "zh-CN",
    timeZone: "Asia/Shanghai",
    spawnFn: (_command, args) => commandChild(args, calls),
    openUrl: async () => {},
    stdout: output,
    stderr: new PassThrough(),
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(result, 0);
  assert.match(outputText, /https:\/\/klingai\.com\/app.*openclaw kling-ai login --region cn/u);
  assert.match(outputText, /https:\/\/kling\.ai\/.*default/u);
  assert.equal(JSON.parse(calls.find((args) => args[2] === "set")[4]).url, "https://kling.ai/mcp");
});

test("does not replace or authorize a custom MCP server", async () => {
  const calls = [];
  const regions = [];
  const errors = new PassThrough();
  let errorText = "";
  errors.on("data", (chunk) => {
    errorText += chunk.toString();
  });

  const result = await runKlingLogin({
    ...oauthDependencies(regions),
    region: "global",
    spawnFn: (_command, args) => commandChild(args, calls, { url: "https://mcp.example.test" }),
    openUrl: async () => {},
    stdout: new PassThrough(),
    stderr: errors,
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(result, 1);
  assert.deepEqual(regions, []);
  assert.match(errorText, /uses a custom URL and was not changed/u);
  assert.deepEqual(calls.map((args) => args.slice(1, 3)), [["mcp", "show"]]);
});

test("reports both regions without exposing credential data", async () => {
  const output = new PassThrough();
  let outputText = "";
  output.on("data", (chunk) => {
    outputText += chunk.toString();
  });

  const result = await runKlingStatus({
    region: "all",
    spawnFn: (_command, args) => {
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      queueMicrotask(() => {
        child.stdout.write(JSON.stringify({
          servers: [{
            name: KLING_MCP_SERVER_NAME,
            launch: createKlingMcpServerConfig("cn").url,
            authStatus: {
              state: "authorized",
              accessToken: "must-not-be-printed"
            }
          }]
        }));
        child.emit("exit", 0, null);
      });
      return child;
    },
    stdout: output,
    stderr: new PassThrough(),
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(result, 0);
  assert.match(outputText, /International \(account on https:\/\/kling\.ai\/\): inactive/u);
  assert.match(outputText, /China \(account on https:\/\/klingai\.com\/app\): active \(authorized\)/u);
  assert.doesNotMatch(outputText, /must-not-be-printed/u);
});

test("refuses to log out an account site that is not active", async () => {
  const calls = [];
  const errors = new PassThrough();
  let errorText = "";
  errors.on("data", (chunk) => {
    errorText += chunk.toString();
  });

  const result = await runKlingLogout({
    region: "cn",
    spawnFn: (_command, args) => commandChild(args, calls, KLING_MCP_SERVER_CONFIG),
    stdout: new PassThrough(),
    stderr: errors,
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(result, 1);
  assert.match(errorText, /https:\/\/klingai\.com\/app.*active service is.*https:\/\/kling\.ai\//u);
  assert.deepEqual(calls.map((args) => args.slice(1, 3)), [["mcp", "show"]]);
});

test("logout clears both native fallback state and the plugin auth profile", async () => {
  const calls = [];
  const removed = [];
  const result = await runKlingLogout({
    region: "global",
    removeCredentials: async ({ region }) => removed.push(region),
    spawnFn: (_command, args) => commandChild(args, calls, KLING_MCP_SERVER_CONFIG),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(result, 0);
  assert.deepEqual(removed, ["global"]);
  assert.deepEqual(calls.map((args) => args.slice(1, 3)), [
    ["mcp", "show"],
    ["mcp", "logout"]
  ]);
});

test("switches account sites without starting authorization", async () => {
  const calls = [];
  const removed = [];
  const output = new PassThrough();
  let outputText = "";
  output.on("data", (chunk) => {
    outputText += chunk.toString();
  });

  const result = await runKlingUse({
    region: "cn",
    removeCredentials: async ({ region }) => removed.push(region),
    spawnFn: (_command, args) => commandChild(args, calls, KLING_MCP_SERVER_CONFIG),
    stdout: output,
    stderr: new PassThrough(),
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(result, 0);
  assert.deepEqual(removed, ["global"]);
  assert.deepEqual(calls.map((args) => args.slice(1, 3)), [
    ["mcp", "show"],
    ["mcp", "logout"],
    ["mcp", "unset"],
    ["mcp", "set"]
  ]);
  assert.doesNotMatch(JSON.stringify(calls), /\["mcp","login"\]/u);
  assert.match(outputText, /openclaw kling-ai login --region cn/u);
  assert.deepEqual(
    JSON.parse(calls.find((args) => args[2] === "set")[4]),
    createKlingMcpServerConfig("cn", { authProfileId: KLING_OAUTH_PROFILE_IDS.cn })
  );
});
