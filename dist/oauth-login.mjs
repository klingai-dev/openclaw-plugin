import { spawn } from "node:child_process";
import {
  createKlingMcpServerConfig,
  findKlingRegionByUrl,
  KLING_DEFAULT_REGION,
  KLING_MCP_REGIONS,
  KLING_MCP_SERVER_NAME,
  normalizeKlingRegion
} from "./kling-mcp-config.mjs";
import {
  authorizeKlingOAuth,
  KLING_OAUTH_PROFILE_IDS
} from "./kling-oauth-client.mjs";

const CHINA_TIME_ZONES = new Set([
  "Asia/Chongqing",
  "Asia/Harbin",
  "Asia/Shanghai",
  "Asia/Urumqi"
]);

function readConfiguredRegion(value) {
  try {
    return findKlingRegionByUrl(JSON.parse(value).url);
  } catch {
    return undefined;
  }
}

function readConfiguredServer(value) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function isMissingKlingServer(result) {
  return `${result.stdout}\n${result.stderr}`.includes(`No MCP server named "${KLING_MCP_SERVER_NAME}"`);
}

function writeCommandFailure(result, stdout, stderr) {
  stdout.write(result.stdout);
  stderr.write(result.stderr);
  return result.code;
}

function readStatusRegion(region = "all") {
  if (region === "all") return region;
  return normalizeKlingRegion(region);
}

function readRequiredRegion(region) {
  if (region === undefined) {
    throw new Error(
      'Missing required region. Use "global" for accounts on https://kling.ai/ ' +
      'or "cn" for accounts on https://klingai.com/app.'
    );
  }
  return normalizeKlingRegion(region);
}

function regionLabel(region) {
  return region === "global"
    ? "International (account on https://kling.ai/)"
    : "China (account on https://klingai.com/app)";
}

function authorizationState(server) {
  if (typeof server?.authStatus?.state === "string") return server.authStatus.state;
  if (server?.authStatus?.hasTokens === true) return "authorized";
  return "not-authorized";
}

export function shouldRecommendChinaRegion({ locale, timeZone } = {}) {
  const normalizedLocale = locale?.replaceAll("_", "-").toLowerCase();
  return CHINA_TIME_ZONES.has(timeZone) ||
    normalizedLocale === "zh-cn" ||
    normalizedLocale?.startsWith("zh-cn-") === true ||
    normalizedLocale === "zh-hans-cn" ||
    normalizedLocale?.startsWith("zh-hans-cn-") === true;
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
  forwardStderr = true
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
  locale = Intl.DateTimeFormat().resolvedOptions().locale,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  spawnFn = spawn,
  openUrl = openInBrowser,
  stdout = process.stdout,
  stderr = process.stderr,
  executable = process.execPath,
  cliEntry = process.argv[1],
  authorize = authorizeKlingOAuth,
  saveCredentials
} = {}) {
  if (typeof saveCredentials !== "function") {
    stderr.write("Kling AI plugin OAuth storage is unavailable. Reinstall or update the plugin.\n");
    return 1;
  }
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
  let configuredServer;
  let configuredRegion;

  if (showResult.code !== 0) {
    const missingServer = `No MCP server named "${KLING_MCP_SERVER_NAME}"`;
    if (!`${showResult.stdout}\n${showResult.stderr}`.includes(missingServer)) {
      stdout.write(showResult.stdout);
      stderr.write(showResult.stderr);
      return showResult.code;
    }

    if (!requestedRegion && shouldRecommendChinaRegion({ locale, timeZone })) {
      stdout.write(
        "A mainland China locale or time zone was detected. " +
        "If you use your account on https://klingai.com/app, run: openclaw kling-ai login --region cn\n" +
        "Continuing with the international service for accounts on https://kling.ai/ because it is the default.\n"
      );
    }

  } else {
    configuredServer = readConfiguredServer(showResult.stdout);
    configuredRegion = readConfiguredRegion(showResult.stdout);
    activeRegion = requestedRegion ?? configuredRegion ?? KLING_DEFAULT_REGION;

    if (requestedRegion && !configuredRegion) {
      stderr.write(`The existing "${KLING_MCP_SERVER_NAME}" server uses a custom URL and was not changed.\n`);
      return 1;
    }

  }

  let credentials;
  try {
    credentials = await authorize({
      region: activeRegion,
      openUrl,
      stdout,
      stderr
    });
  } catch (error) {
    stderr.write(`${error.message}\n`);
    return 1;
  }

  let profileId;
  try {
    profileId = await saveCredentials({ region: activeRegion, credentials });
  } catch (error) {
    stderr.write(`Could not save Kling AI OAuth credentials: ${error.message}\n`);
    return 1;
  }
  if (profileId !== KLING_OAUTH_PROFILE_IDS[activeRegion]) {
    stderr.write("Kling AI OAuth credentials were saved under an unexpected profile id.\n");
    return 1;
  }

  const nextConfig = Object.freeze({
    ...createKlingMcpServerConfig(activeRegion, { authProfileId: profileId }),
    ...(configuredRegion === activeRegion && configuredServer ? configuredServer : {}),
    url: createKlingMcpServerConfig(activeRegion).url,
    transport: "streamable-http",
    auth: "oauth",
    oauth: Object.freeze({
      ...(configuredRegion === activeRegion ? configuredServer?.oauth : {}),
      authProfileId: profileId
    })
  });

  if (configuredServer) {
    const logoutResult = await runOpenClawCommand(["mcp", "logout", KLING_MCP_SERVER_NAME], {
      spawnFn,
      stdout,
      stderr,
      executable,
      cliEntry
    });
    if (logoutResult.code !== 0) return logoutResult.code;
  }

  const setResult = await runOpenClawCommand([
    "mcp",
    "set",
    KLING_MCP_SERVER_NAME,
    JSON.stringify(nextConfig)
  ], { spawnFn, stdout, stderr, executable, cliEntry });
  if (setResult.code !== 0) return setResult.code;

  stdout.write(`Kling AI authorization saved for ${regionLabel(activeRegion)} as OpenClaw-Plugin.\n`);
  return 0;
}

export async function runKlingStatus({
  region = "all",
  spawnFn = spawn,
  stdout = process.stdout,
  stderr = process.stderr,
  executable = process.execPath,
  cliEntry = process.argv[1]
} = {}) {
  let requestedRegion;
  try {
    requestedRegion = readStatusRegion(region);
  } catch (error) {
    stderr.write(`${error.message}\n`);
    return 1;
  }

  const statusResult = await runOpenClawCommand(["mcp", "status", "--json"], {
    spawnFn,
    stdout,
    stderr,
    executable,
    cliEntry,
    forwardStdout: false,
    forwardStderr: false
  });
  if (statusResult.code !== 0) return writeCommandFailure(statusResult, stdout, stderr);

  let servers;
  try {
    servers = JSON.parse(statusResult.stdout).servers;
  } catch {
    stderr.write("OpenClaw returned an invalid MCP status response.\n");
    return 1;
  }

  const server = Array.isArray(servers)
    ? servers.find(({ name }) => name === KLING_MCP_SERVER_NAME)
    : undefined;
  const activeRegion = findKlingRegionByUrl(server?.launch);
  const regions = requestedRegion === "all" ? ["global", "cn"] : [requestedRegion];

  for (const candidate of regions) {
    const label = regionLabel(candidate);
    if (candidate === activeRegion) {
      stdout.write(`${label}: active (${authorizationState(server)}) - ${KLING_MCP_REGIONS[candidate].url}\n`);
    } else {
      stdout.write(`${label}: inactive - ${KLING_MCP_REGIONS[candidate].url}\n`);
    }
  }

  if (server && !activeRegion) {
    stdout.write(`Custom: active - ${server.launch ?? "unknown URL"}\n`);
  }
  return 0;
}

export async function runKlingLogout({
  region,
  spawnFn = spawn,
  stdout = process.stdout,
  stderr = process.stderr,
  executable = process.execPath,
  cliEntry = process.argv[1],
  removeCredentials
} = {}) {
  let requestedRegion;
  try {
    requestedRegion = readRequiredRegion(region);
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
  if (showResult.code !== 0) {
    if (isMissingKlingServer(showResult)) {
      stdout.write("Kling AI is not configured; nothing was changed.\n");
      return 0;
    }
    return writeCommandFailure(showResult, stdout, stderr);
  }

  const activeRegion = readConfiguredRegion(showResult.stdout);
  if (!activeRegion) {
    stderr.write(`The existing "${KLING_MCP_SERVER_NAME}" server uses a custom URL and was not changed.\n`);
    return 1;
  }
  if (activeRegion !== requestedRegion) {
    stderr.write(
      `Cannot log out ${regionLabel(requestedRegion)}: ` +
      `the active service is ${regionLabel(activeRegion)}.\n`
    );
    return 1;
  }

  const logoutResult = await runOpenClawCommand(["mcp", "logout", KLING_MCP_SERVER_NAME], {
    spawnFn,
    stdout,
    stderr,
    executable,
    cliEntry
  });
  if (logoutResult.code !== 0) return logoutResult.code;
  if (typeof removeCredentials === "function") {
    try {
      await removeCredentials({ region: requestedRegion });
    } catch (error) {
      stderr.write(`Could not remove Kling AI OAuth credentials: ${error.message}\n`);
      return 1;
    }
  }
  return 0;
}

export async function runKlingUse({
  region,
  spawnFn = spawn,
  stdout = process.stdout,
  stderr = process.stderr,
  executable = process.execPath,
  cliEntry = process.argv[1],
  removeCredentials
} = {}) {
  let requestedRegion;
  try {
    requestedRegion = readRequiredRegion(region);
  } catch (error) {
    stderr.write(`${error.message}\n`);
    return 1;
  }

  const commandOptions = { spawnFn, stdout, stderr, executable, cliEntry };
  const showResult = await runOpenClawCommand(["mcp", "show", KLING_MCP_SERVER_NAME, "--json"], {
    ...commandOptions,
    forwardStdout: false,
    forwardStderr: false
  });

  if (showResult.code === 0) {
    const activeRegion = readConfiguredRegion(showResult.stdout);
    if (!activeRegion) {
      stderr.write(`The existing "${KLING_MCP_SERVER_NAME}" server uses a custom URL and was not changed.\n`);
      return 1;
    }
    if (activeRegion === requestedRegion) {
      stdout.write(`Kling AI already uses ${regionLabel(requestedRegion)}.\n`);
      return 0;
    }

    const logoutResult = await runOpenClawCommand(["mcp", "logout", KLING_MCP_SERVER_NAME], commandOptions);
    if (logoutResult.code !== 0) return logoutResult.code;
    if (typeof removeCredentials === "function") {
      try {
        await removeCredentials({ region: activeRegion });
      } catch (error) {
        stderr.write(`Could not remove Kling AI OAuth credentials: ${error.message}\n`);
        return 1;
      }
    }
    const unsetResult = await runOpenClawCommand(["mcp", "unset", KLING_MCP_SERVER_NAME], commandOptions);
    if (unsetResult.code !== 0) return unsetResult.code;
  } else if (!isMissingKlingServer(showResult)) {
    return writeCommandFailure(showResult, stdout, stderr);
  }

  const setResult = await runOpenClawCommand([
    "mcp",
    "set",
    KLING_MCP_SERVER_NAME,
    JSON.stringify(createKlingMcpServerConfig(requestedRegion, {
      authProfileId: KLING_OAUTH_PROFILE_IDS[requestedRegion]
    }))
  ], commandOptions);
  if (setResult.code !== 0) return setResult.code;

  stdout.write(
    `Kling AI now uses ${regionLabel(requestedRegion)}. ` +
    `Authorize it with: openclaw kling-ai login --region ${requestedRegion}\n`
  );
  return 0;
}
