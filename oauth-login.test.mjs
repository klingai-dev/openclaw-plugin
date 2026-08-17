import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import {
  createKlingMcpServerConfig,
  KLING_MCP_SERVER_CONFIG,
  KLING_MCP_SERVER_NAME
} from "./kling-mcp-config.mjs";
import {
  isKlingAuthorizationUrl,
  runKlingLogin,
  shouldRecommendChinaRegion
} from "./oauth-login.mjs";

const validChinaUrl = "https://klingai.com/auth/authorize?redirect_uri=http%3A%2F%2F127.0.0.1%3A8989%2Foauth%2Fcallback&state=fresh";
const validGlobalUrl = "https://kling.ai/auth/authorize?redirect_uri=http%3A%2F%2F127.0.0.1%3A8989%2Foauth%2Fcallback&state=fresh";

test("only opens the expected Kling loopback authorization URL", () => {
  assert.equal(isKlingAuthorizationUrl(validGlobalUrl), true);
  assert.equal(isKlingAuthorizationUrl(validChinaUrl), false);
  assert.equal(isKlingAuthorizationUrl("https://evil.example/auth/authorize?redirect_uri=http%3A%2F%2F127.0.0.1%3A8989"), false);
  assert.equal(isKlingAuthorizationUrl("https://klingai.com/auth/authorize?redirect_uri=https%3A%2F%2Fevil.example"), false);
  assert.equal(isKlingAuthorizationUrl(validGlobalUrl, "global"), true);
  assert.equal(isKlingAuthorizationUrl(validGlobalUrl, "cn"), false);
});

test("builds the official MCP configuration for each region", () => {
  assert.equal(KLING_MCP_SERVER_CONFIG.url, "https://kling.ai/mcp");
  assert.equal(createKlingMcpServerConfig("cn").url, "https://klingai.com/mcp");
  assert.equal(createKlingMcpServerConfig("global").url, "https://kling.ai/mcp");
  assert.throws(() => createKlingMcpServerConfig("unknown"), /Use "cn" or "global"/u);
});

test("recommends China without changing the global default", () => {
  assert.equal(shouldRecommendChinaRegion({ locale: "zh-CN", timeZone: "UTC" }), true);
  assert.equal(shouldRecommendChinaRegion({ locale: "zh-Hans-CN", timeZone: "UTC" }), true);
  assert.equal(shouldRecommendChinaRegion({ locale: "en-US", timeZone: "Asia/Shanghai" }), true);
  assert.equal(shouldRecommendChinaRegion({ locale: "en-US", timeZone: "America/Los_Angeles" }), false);
  assert.equal(KLING_MCP_SERVER_CONFIG.url, "https://kling.ai/mcp");
});

test("opens exactly the fresh URL emitted by the native OpenClaw login", async () => {
  const opened = [];
  const calls = [];
  const output = new PassThrough();
  const errors = new PassThrough();
  const result = runKlingLogin({
    spawnFn: (_command, args) => {
      calls.push(args);
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      queueMicrotask(() => {
        if (args[2] === "show") {
          child.stderr.write('No MCP server named "Plugin-OpenClaw-kling-ai"\n');
          child.emit("exit", 1, null);
        } else if (args[2] === "set") {
          child.emit("exit", 0, null);
        } else {
          child.stdout.write('Open this URL to authorize "Plugin-OpenClaw-kling-ai":\n');
          child.stdout.write(`${validGlobalUrl}\n`);
          child.stdout.write(`${validGlobalUrl}\n`);
          child.emit("exit", 0, null);
        }
      });
      return child;
    },
    openUrl: async (url) => opened.push(url),
    stdout: output,
    stderr: errors,
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(await result, 0);
  assert.deepEqual(opened, [validGlobalUrl]);
  const setCall = calls.find((args) => args[2] === "set");
  assert.equal(setCall[3], KLING_MCP_SERVER_NAME);
  assert.deepEqual(JSON.parse(setCall[4]), KLING_MCP_SERVER_CONFIG);
  assert.deepEqual(calls.map((args) => args.slice(1, 3)), [
    ["mcp", "show"],
    ["mcp", "set"],
    ["mcp", "login"]
  ]);
});

test("does not overwrite an existing operator MCP server", async () => {
  const calls = [];
  const result = await runKlingLogin({
    spawnFn: (_command, args) => {
      calls.push(args);
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      queueMicrotask(() => {
        if (args[2] === "show") child.stdout.write(JSON.stringify(KLING_MCP_SERVER_CONFIG));
        child.emit("exit", 0, null);
      });
      return child;
    },
    openUrl: async () => {},
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(result, 0);
  assert.deepEqual(calls.map((args) => args.slice(1, 3)), [
    ["mcp", "show"],
    ["mcp", "login"]
  ]);
});

test("keeps the configured China region when login has no region option", async () => {
  const calls = [];
  const opened = [];
  const chinaConfig = createKlingMcpServerConfig("cn");
  const result = await runKlingLogin({
    spawnFn: (_command, args) => {
      calls.push(args);
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      queueMicrotask(() => {
        if (args[2] === "show") child.stdout.write(JSON.stringify(chinaConfig));
        if (args[2] === "login") {
          child.stdout.write('Open this URL to authorize "Plugin-OpenClaw-kling-ai":\n');
          child.stdout.write(`${validChinaUrl}\n`);
        }
        child.emit("exit", 0, null);
      });
      return child;
    },
    openUrl: async (url) => opened.push(url),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(result, 0);
  assert.deepEqual(opened, [validChinaUrl]);
  assert.deepEqual(calls.map((args) => args.slice(1, 3)), [
    ["mcp", "show"],
    ["mcp", "login"]
  ]);
});

test("logs out before switching between official regions", async () => {
  const calls = [];
  const result = await runKlingLogin({
    region: "cn",
    spawnFn: (_command, args) => {
      calls.push(args);
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      queueMicrotask(() => {
        if (args[2] === "show") child.stdout.write(JSON.stringify(KLING_MCP_SERVER_CONFIG));
        child.emit("exit", 0, null);
      });
      return child;
    },
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
    ["mcp", "unset"],
    ["mcp", "set"],
    ["mcp", "login"]
  ]);
  const setCall = calls.find((args) => args[2] === "set");
  assert.deepEqual(JSON.parse(setCall[4]), createKlingMcpServerConfig("cn"));
});

test("prints a China recommendation but configures global by default", async () => {
  const calls = [];
  const output = new PassThrough();
  let outputText = "";
  output.on("data", (chunk) => {
    outputText += chunk.toString();
  });

  const result = await runKlingLogin({
    locale: "zh-CN",
    timeZone: "Asia/Shanghai",
    spawnFn: (_command, args) => {
      calls.push(args);
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      queueMicrotask(() => {
        if (args[2] === "show") {
          child.stderr.write('No MCP server named "Plugin-OpenClaw-kling-ai"\n');
          child.emit("exit", 1, null);
        } else {
          child.emit("exit", 0, null);
        }
      });
      return child;
    },
    openUrl: async () => {},
    stdout: output,
    stderr: new PassThrough(),
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(result, 0);
  assert.match(outputText, /use: openclaw kling-ai login --region cn/u);
  assert.match(outputText, /global service because it is the default/u);
  const setCall = calls.find((args) => args[2] === "set");
  assert.deepEqual(JSON.parse(setCall[4]), createKlingMcpServerConfig("global"));
});

test("does not replace a custom server URL during a region switch", async () => {
  const calls = [];
  const errors = new PassThrough();
  let errorText = "";
  errors.on("data", (chunk) => {
    errorText += chunk.toString();
  });

  const result = await runKlingLogin({
    region: "global",
    spawnFn: (_command, args) => {
      calls.push(args);
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      queueMicrotask(() => {
        child.stdout.write(JSON.stringify({ url: "https://mcp.example.test" }));
        child.emit("exit", 0, null);
      });
      return child;
    },
    openUrl: async () => {},
    stdout: new PassThrough(),
    stderr: errors,
    executable: "node",
    cliEntry: "openclaw"
  });

  assert.equal(result, 1);
  assert.match(errorText, /uses a custom URL and was not changed/u);
  assert.deepEqual(calls.map((args) => args.slice(1, 3)), [["mcp", "show"]]);
});
