# Kling AI for OpenClaw

This native OpenClaw plugin uses `openclaw.plugin.json`, a native extension entrypoint, and a login-time remote MCP bootstrap that preserves existing operator configuration. OpenClaw owns the MCP connection, OAuth authorization, credential storage, and token refresh. The package does not provide a custom authorization page or ask users to paste an API key. It requires Node.js 22.22.3+/24.15.0+/25.9.0+ and OpenClaw 2026.7.1-2+.

## Installation

Link a local development checkout:

```bash
openclaw plugins install --link /absolute/path/to/openclaw-plugin
openclaw plugins enable kling-ai
openclaw gateway restart
```

Before publishing, create a tarball and test the official `npm-pack:` installation path:

```bash
npm pack --pack-destination /tmp
openclaw plugins install npm-pack:/tmp/kling-ai-openclaw-1.1.2.tgz --force
```

Verify the installed plugin:

```bash
openclaw plugins list --verbose
openclaw plugins inspect kling-ai
openclaw plugins inspect kling-ai --runtime --json
```

The plugin should report `Format: openclaw`, and its Skills and `kling-ai` CLI command should be available. The MCP server becomes available after the login command initializes or discovers its operator configuration.

Open the Control UI through the official entrypoint:

```bash
openclaw dashboard
```

## Native OAuth authorization and refresh

Start the one-step plugin login flow. New configurations use the global service by default:

```bash
openclaw kling-ai login
```

For mainland China accounts, use the China service explicitly:

```bash
openclaw kling-ai login --region cn
```

The official endpoints are `https://kling.ai/mcp` for global accounts and `https://klingai.com/mcp` for China. On first login, a mainland China locale or time zone prints a recommendation for `--region cn` but does not switch automatically. Running `openclaw kling-ai login` without `--region` keeps the currently configured official region. An explicit region change logs out the old region before replacing the single `Plugin-OpenClaw-kling-ai` server entry, so credentials are never reused across regions.

This command starts OpenClaw's native MCP OAuth flow and opens the authorization URL created for the current login session. OpenClaw continues to own credential storage, PKCE verification, the callback, and token refresh. Keep the terminal running while authorization completes. Success is confirmed by:

```text
MCP OAuth credentials saved for "Plugin-OpenClaw-kling-ai".
```

Do not reuse a URL or code from an earlier login because starting a new login invalidates the previous PKCE session. If the browser cannot open automatically or the callback cannot reach the local process, use the URL or code printed by the current session:

```bash
openclaw mcp login Plugin-OpenClaw-kling-ai --code "<code>"
```

OpenClaw performs OAuth dynamic client registration with its host-level `client_name`. The plugin's MCP bootstrap adds the non-secret `X-Kling-Integration: Plugin-OpenClaw` header so the Kling service can distinguish plugin traffic from a generic manually configured OpenClaw MCP connection. This telemetry-only marker does not control authentication, rollout, billing, or generation behavior. Do not move it into a token, URL parameter, or tool argument.

`openclaw kling-ai login` saves the bundled MCP definition only when the operator configuration is missing. It does not overwrite an existing custom operator definition. For manual recovery, preserve the exact server key and telemetry header and choose one official endpoint:

```bash
# China
openclaw mcp set Plugin-OpenClaw-kling-ai '{"url":"https://klingai.com/mcp","transport":"streamable-http","auth":"oauth","headers":{"X-Kling-Integration":"Plugin-OpenClaw"},"connectionTimeoutMs":30000,"requestTimeoutMs":60000,"supportsParallelToolCalls":true}'

# Global
openclaw mcp set Plugin-OpenClaw-kling-ai '{"url":"https://kling.ai/mcp","transport":"streamable-http","auth":"oauth","headers":{"X-Kling-Integration":"Plugin-OpenClaw"},"connectionTimeoutMs":30000,"requestTimeoutMs":60000,"supportsParallelToolCalls":true}'
```

Normal generation requests should call the matching generation tool directly. `who_am_i` is reserved for explicit account-identity or authorization-status checks and is not a generation preflight.

Verify authorization and connectivity:

```bash
openclaw mcp status --verbose
openclaw mcp doctor Plugin-OpenClaw-kling-ai --probe
```

OpenClaw stores access and refresh tokens in its owner-only SQLite OAuth store and automatically refreshes and rotates them. Do not read, copy, log, or commit token data. If refresh is rejected or scopes are insufficient, run `openclaw kling-ai login` again. Do not retry a generation submission.

Log out while retaining the server definition:

```bash
openclaw mcp logout Plugin-OpenClaw-kling-ai
```

## Usage

Describe the generation request in natural language or invoke the native `/kling-ai` Skill command. Before a credit-consuming generation, confirm the final settings. Submit each approved intent only once.

The remote Kling MCP server performs all generation and result queries. This plugin does not register, bundle, or depend on a local MCP server. When the remote tool returns an MCP App resource, OpenClaw renders it on supported surfaces. Otherwise, the response uses the text, media, or primary result link returned by the same remote call.

The conversation preserves the exact `generationId` and any available `taskTraceId`. Continue an item-specific action with:

```text
/kling-ai-result [item-number] <action>
```

MCP App rendering remains subject to the normal OpenClaw setting and effective tool policy. Configuring the remote server does not bypass either boundary.

```bash
openclaw config set mcp.apps.enabled true --strict-json
openclaw gateway restart
```

Long-running work continues on Kling's servers. Closing OpenClaw does not cancel a remote task, but it interrupts automatic result delivery. Reopen OpenClaw and query the preserved `generationId` to recover the result.

## Uninstall and verification

```bash
openclaw plugins uninstall kling-ai --force
openclaw gateway restart
npm run verify
```

The plugin registers two reply hooks that normalize Kling Markdown image results into native OpenClaw media. It does not register custom tools or write plugin config. The empty `configSchema` enables strict pre-load validation. Generation confirmation, one-shot submission, and result formatting are governed by `skills/kling-ai/SKILL.md` and `skills/kling-ai-result/SKILL.md`.
