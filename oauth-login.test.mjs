import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { isKlingAuthorizationUrl, runKlingLogin } from "./oauth-login.mjs";

const validUrl = "https://klingai.com/auth/authorize?redirect_uri=http%3A%2F%2F127.0.0.1%3A8989%2Foauth%2Fcallback&state=fresh";

test("only opens the expected Kling loopback authorization URL", () => {
  assert.equal(isKlingAuthorizationUrl(validUrl), true);
  assert.equal(isKlingAuthorizationUrl("https://evil.example/auth/authorize?redirect_uri=http%3A%2F%2F127.0.0.1%3A8989"), false);
  assert.equal(isKlingAuthorizationUrl("https://klingai.com/auth/authorize?redirect_uri=https%3A%2F%2Fevil.example"), false);
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
          child.stdout.write(`${validUrl}\n`);
          child.stdout.write(`${validUrl}\n`);
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
  assert.deepEqual(opened, [validUrl]);
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
      queueMicrotask(() => child.emit("exit", 0, null));
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
