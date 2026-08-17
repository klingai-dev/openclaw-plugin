import { spawn } from "node:child_process";
import pluginManifest from "./openclaw.plugin.json" with { type: "json" };

const MCP_SERVER_NAME = "Plugin-OpenClaw-kling-ai";
const AUTHORIZATION_MARKER = `Open this URL to authorize "${MCP_SERVER_NAME}":`;
const MCP_SERVER_CONFIG = pluginManifest.mcpServers?.[MCP_SERVER_NAME];

if (!MCP_SERVER_CONFIG) {
  throw new Error(`Missing MCP server "${MCP_SERVER_NAME}" in openclaw.plugin.json.`);
}

export function isKlingAuthorizationUrl(value) {
  try {
    const url = new URL(value);
    const redirectUrl = new URL(url.searchParams.get("redirect_uri") ?? "");
    return url.protocol === "https:" &&
      url.hostname === "klingai.com" &&
      url.pathname === "/auth/authorize" &&
      redirectUrl.protocol === "http:" &&
      redirectUrl.hostname === "127.0.0.1" &&
      redirectUrl.port === "8989" &&
      redirectUrl.pathname === "/oauth/callback";
  } catch {
    return false;
  }
}

export function openInBrowser(url, platform = process.platform, spawnFn = spawn) {
  const command = platform === "darwin" ? "open" : platform === "win32" ? "powershell.exe" : "xdg-open";
  const args = platform === "win32"
    ? ["-NoProfile", "-NonInteractive", "-Command", "Start-Process -FilePath $args[0]", url]
    : [url];

  return new Promise((resolve, reject) => {
    const child = spawnFn(command, args, { detached: true, stdio: "ignore" });
    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
}

function runOpenClawCommand(args, {
  spawnFn,
  stdout,
  stderr,
  executable,
  cliEntry,
  forwardStdout = true,
  forwardStderr = true,
  onStdout
}) {
  return new Promise((resolve, reject) => {
    const child = spawnFn(executable, [cliEntry, ...args], {
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["inherit", "pipe", "pipe"]
    });
    let capturedStdout = "";
    let capturedStderr = "";

    child.stdout.on("data", (chunk) => {
      capturedStdout += chunk.toString();
      if (forwardStdout) stdout.write(chunk);
      onStdout?.(chunk);
    });
    child.stderr.on("data", (chunk) => {
      capturedStderr += chunk.toString();
      if (forwardStderr) stderr.write(chunk);
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`OpenClaw command stopped by ${signal}.`));
      else resolve({ code: code ?? 1, stdout: capturedStdout, stderr: capturedStderr });
    });
  });
}

export async function runKlingLogin({
  spawnFn = spawn,
  openUrl = openInBrowser,
  stdout = process.stdout,
  stderr = process.stderr,
  executable = process.execPath,
  cliEntry = process.argv[1]
} = {}) {
  const showResult = await runOpenClawCommand(["mcp", "show", MCP_SERVER_NAME, "--json"], {
    spawnFn,
    stdout,
    stderr,
    executable,
    cliEntry,
    forwardStdout: false,
    forwardStderr: false
  });

  if (showResult.code !== 0) {
    const missingServer = `No MCP server named "${MCP_SERVER_NAME}"`;
    if (!`${showResult.stdout}\n${showResult.stderr}`.includes(missingServer)) {
      stdout.write(showResult.stdout);
      stderr.write(showResult.stderr);
      return showResult.code;
    }

    const setResult = await runOpenClawCommand([
      "mcp",
      "set",
      MCP_SERVER_NAME,
      JSON.stringify(MCP_SERVER_CONFIG)
    ], { spawnFn, stdout, stderr, executable, cliEntry });
    if (setResult.code !== 0) return setResult.code;
  }

  let buffer = "";
  let awaitingAuthorizationUrl = false;
  let browserOpened = false;

  const inspect = (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.includes(AUTHORIZATION_MARKER)) {
        awaitingAuthorizationUrl = true;
        continue;
      }
      const candidate = line.trim();
      if (!browserOpened && awaitingAuthorizationUrl && isKlingAuthorizationUrl(candidate)) {
        browserOpened = true;
        awaitingAuthorizationUrl = false;
        void openUrl(candidate).then(
          () => stdout.write("Opened the current Kling AI authorization page in your browser.\n"),
          (error) => stderr.write(`Could not open the browser automatically: ${error.message}\n`)
        );
      }
    }
  };

  const loginResult = await runOpenClawCommand(["mcp", "login", MCP_SERVER_NAME], {
    spawnFn,
    stdout,
    stderr,
    executable,
    cliEntry,
    onStdout: inspect
  });
  return loginResult.code;
}
