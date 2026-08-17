import { spawn } from "node:child_process";
import {
  createKlingMcpServerConfig,
  findKlingRegionByUrl,
  KLING_DEFAULT_REGION,
  KLING_MCP_REGIONS,
  KLING_MCP_SERVER_NAME,
  normalizeKlingRegion
} from "./kling-mcp-config.mjs";

const AUTHORIZATION_MARKER = `Open this URL to authorize "${KLING_MCP_SERVER_NAME}":`;

export function isKlingAuthorizationUrl(value, region = KLING_DEFAULT_REGION) {
  try {
    const normalizedRegion = normalizeKlingRegion(region);
    const url = new URL(value);
    const redirectUrl = new URL(url.searchParams.get("redirect_uri") ?? "");
    return url.protocol === "https:" &&
      url.hostname === KLING_MCP_REGIONS[normalizedRegion].authorizationHost &&
      url.pathname === "/auth/authorize" &&
      redirectUrl.protocol === "http:" &&
      redirectUrl.hostname === "127.0.0.1" &&
      redirectUrl.port === "8989" &&
      redirectUrl.pathname === "/oauth/callback";
  } catch {
    return false;
  }
}

function readConfiguredRegion(value) {
  try {
    return findKlingRegionByUrl(JSON.parse(value).url);
  } catch {
    return undefined;
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
  region,
  spawnFn = spawn,
  openUrl = openInBrowser,
  stdout = process.stdout,
  stderr = process.stderr,
  executable = process.execPath,
  cliEntry = process.argv[1]
} = {}) {
  let requestedRegion;
  try {
    requestedRegion = region === undefined ? undefined : normalizeKlingRegion(region);
  } catch (error) {
    stderr.write(`${error.message}\n`);
    return 1;
  }

  const showResult = await runOpenClawCommand(["mcp", "show", KLING_MCP_SERVER_NAME, "--json"], {
    spawnFn,
    stdout,
    stderr,
    executable,
    cliEntry,
    forwardStdout: false,
    forwardStderr: false
  });

  let activeRegion = requestedRegion ?? KLING_DEFAULT_REGION;

  if (showResult.code !== 0) {
    const missingServer = `No MCP server named "${KLING_MCP_SERVER_NAME}"`;
    if (!`${showResult.stdout}\n${showResult.stderr}`.includes(missingServer)) {
      stdout.write(showResult.stdout);
      stderr.write(showResult.stderr);
      return showResult.code;
    }

    const serverConfig = createKlingMcpServerConfig(activeRegion);
    const setResult = await runOpenClawCommand([
      "mcp",
      "set",
      KLING_MCP_SERVER_NAME,
      JSON.stringify(serverConfig)
    ], { spawnFn, stdout, stderr, executable, cliEntry });
    if (setResult.code !== 0) return setResult.code;
  } else {
    const configuredRegion = readConfiguredRegion(showResult.stdout);
    activeRegion = requestedRegion ?? configuredRegion ?? KLING_DEFAULT_REGION;

    if (requestedRegion && !configuredRegion) {
      stderr.write(`The existing "${KLING_MCP_SERVER_NAME}" server uses a custom URL and was not changed.\n`);
      return 1;
    }

    if (requestedRegion && requestedRegion !== configuredRegion) {
      const logoutResult = await runOpenClawCommand(["mcp", "logout", KLING_MCP_SERVER_NAME], {
        spawnFn,
        stdout,
        stderr,
        executable,
        cliEntry
      });
      if (logoutResult.code !== 0) return logoutResult.code;

      const unsetResult = await runOpenClawCommand(["mcp", "unset", KLING_MCP_SERVER_NAME], {
        spawnFn,
        stdout,
        stderr,
        executable,
        cliEntry
      });
      if (unsetResult.code !== 0) return unsetResult.code;

      const setResult = await runOpenClawCommand([
        "mcp",
        "set",
        KLING_MCP_SERVER_NAME,
        JSON.stringify(createKlingMcpServerConfig(activeRegion))
      ], { spawnFn, stdout, stderr, executable, cliEntry });
      if (setResult.code !== 0) return setResult.code;
    }
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
      if (!browserOpened && awaitingAuthorizationUrl && isKlingAuthorizationUrl(candidate, activeRegion)) {
        browserOpened = true;
        awaitingAuthorizationUrl = false;
        void openUrl(candidate).then(
          () => stdout.write("Opened the current Kling AI authorization page in your browser.\n"),
          (error) => stderr.write(`Could not open the browser automatically: ${error.message}\n`)
        );
      }
    }
  };

  const loginResult = await runOpenClawCommand(["mcp", "login", KLING_MCP_SERVER_NAME], {
    spawnFn,
    stdout,
    stderr,
    executable,
    cliEntry,
    onStdout: inspect
  });
  return loginResult.code;
}
