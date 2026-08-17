# Kling AI（可灵 AI）for OpenClaw

> 一句话，让灵感从想法变成大片。

Kling AI brings AI image and video generation to OpenClaw. Create with natural language across text-to-image, image-to-image, text-to-video, image-to-video, reference-image, single-shot, and multi-shot workflows. 支持文生图、图生图、文生视频、图生视频、参考图创作、单镜头与多分镜视频。

## What you can create

- Posters, illustrations, portraits, product images, e-commerce listing images, and product detail visuals
- Product demos, advertising creatives, marketing shorts, social videos, and cinematic concept videos
- Content for platforms such as Taobao, Tmall, JD.com, Pinduoduo, Douyin, Kuaishou, Xiaohongshu, TikTok, Amazon, and Shopify
- End-to-end generation workflows that upload references, check account quota, submit work once, track progress, and return the final image or video

## How it works

This native OpenClaw plugin uses `openclaw.plugin.json`, a native extension entrypoint, and a login-time remote MCP bootstrap that preserves existing operator configuration. The plugin performs OAuth dynamic client registration as `OpenClaw-Plugin`; OpenClaw owns the MCP connection, refresh-capable credential storage, and refresh locking. The package does not provide a custom authorization page or ask users to paste an API key. It requires Node.js 22.22.3+/24.15.0+/25.9.0+ and OpenClaw 2026.7.1-2+.

## Suggested prompts

- Draw a red panda in a vintage spacesuit floating by a space station window, Earth's blue glow lighting its face, richly detailed, cinematic look
- Create a 5-second cinematic video: a mecha warrior crashes down from the sky, shockwave blasting rocks and dust, camera rapidly pushing in with raw power
- Create a 15-second sneaker marketing short: open with a street hook, cut to product close-ups and on-foot action within three seconds, end on a shoe detail close-up

## Installation

Install the latest published release from ClawHub:

```bash
openclaw plugins install clawhub:kling-ai-openclaw
openclaw plugins enable kling-ai
openclaw gateway restart
```

### Local development

Link a local development checkout:

```bash
openclaw plugins install --link /absolute/path/to/openclaw-plugin
openclaw plugins enable kling-ai
openclaw gateway restart
```

### Release testing

Before publishing, create a tarball and test the `npm-pack:` installation path:

```bash
npm pack --pack-destination /tmp
openclaw plugins install npm-pack:/tmp/kling-ai-openclaw-1.1.3.tgz --force
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

## Plugin OAuth authorization and refresh

Choose the service by the website where you normally use your Kling AI account:

| Your Kling AI account website | Region value | Login command |
| --- | --- | --- |
| [https://kling.ai/](https://kling.ai/) | `global` (international, default) | `openclaw kling-ai login --region global` |
| [https://klingai.com/app](https://klingai.com/app) | `cn` (China) | `openclaw kling-ai login --region cn` |

If you are unsure, open the website where your existing Kling AI account and credits appear, then copy the command from the matching row. Running the command without `--region` uses the international service for `https://kling.ai/` on a new installation:

```bash
openclaw kling-ai login
```

For an account used on `https://klingai.com/app`, select the China service explicitly:

```bash
openclaw kling-ai login --region cn
```

### Region commands

Kling AI has separate international and China services. This plugin keeps exactly one active service configuration, so switching services signs out the previous one. Use these commands instead of editing the MCP server manually:

```bash
# Account used on https://kling.ai/ (international; default)
openclaw kling-ai login --region global

# Account used on https://klingai.com/app (China)
openclaw kling-ai login --region cn

# Show both endpoints, the active region, and its authorization state
openclaw kling-ai status --region all

# Sign out of the service for https://klingai.com/app
openclaw kling-ai logout --region cn

# Switch to the service for https://kling.ai/ without starting authorization
openclaw kling-ai use --region global
```

`status --region all` does not imply that both services can be active at once; it reports one active service and one inactive service. `logout` refuses to modify credentials when its `--region` does not match the active account website. `use` clears authorization for the previous service, switches the endpoint, and then prints the exact `login` command required to authorize the selected service. In most cases, copy the matching `login` command from the table above because it switches and authorizes in one flow.

The official MCP endpoints are `https://kling.ai/mcp` for accounts used on `https://kling.ai/` and `https://klingai.com/mcp` for accounts used on `https://klingai.com/app`. On first login, a mainland China locale or time zone prints the website-based recommendation for `--region cn` but does not switch automatically. Running `openclaw kling-ai login` without `--region` keeps the currently configured official service. An explicit service change logs out the old service before replacing the single `Plugin-OpenClaw-kling-ai` server entry, so credentials are never reused across services.

This command starts the plugin's PKCE OAuth flow and opens the authorization URL created for the current login session. The Kling consent page identifies the requesting client as `OpenClaw-Plugin`, which distinguishes an installed Kling plugin from a generic manually configured MCP connection. OpenClaw stores the resulting refresh-capable Auth Profile and coordinates refresh locking. Keep the terminal running while authorization completes. Success is confirmed by:

```text
Kling AI authorization saved for International (account on https://kling.ai/) as OpenClaw-Plugin.
```

Do not reuse a URL or code from an earlier login because starting a new login invalidates the previous PKCE session. If the browser cannot open automatically or the loopback callback cannot reach the local process, rerun the matching `openclaw kling-ai login --region ...` command. Do not replace it with `openclaw mcp login`: the generic MCP command intentionally registers as `OpenClaw MCP`, not `OpenClaw-Plugin`.

The plugin's MCP bootstrap also adds the non-secret `X-Kling-Integration: Plugin-OpenClaw` telemetry header. The OAuth `client_name` is what labels the consent page; the header separately identifies subsequent plugin-originated MCP requests. Neither marker controls authentication, rollout, billing, or generation behavior.

`openclaw kling-ai login` saves the bundled MCP definition only when the operator configuration is missing. It does not overwrite an existing custom operator definition. For manual recovery, preserve the exact server key and telemetry header and choose one official endpoint:

```bash
# China
openclaw mcp set Plugin-OpenClaw-kling-ai '{"url":"https://klingai.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"kling-ai-mcp:cn"},"headers":{"X-Kling-Integration":"Plugin-OpenClaw"},"connectionTimeoutMs":30000,"requestTimeoutMs":60000,"supportsParallelToolCalls":true}'

# Global
openclaw mcp set Plugin-OpenClaw-kling-ai '{"url":"https://kling.ai/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"kling-ai-mcp:global"},"headers":{"X-Kling-Integration":"Plugin-OpenClaw"},"connectionTimeoutMs":30000,"requestTimeoutMs":60000,"supportsParallelToolCalls":true}'
```

Normal generation requests should call the matching generation tool directly. `who_am_i` is reserved for explicit account-identity or authorization-status checks and is not a generation preflight.

Verify authorization and connectivity:

```bash
openclaw mcp status --verbose
openclaw mcp doctor Plugin-OpenClaw-kling-ai --probe
```

The plugin writes access and refresh tokens through OpenClaw's official Auth Profile API, and its registered provider supplies the Kling-specific refresh operation. Do not read, copy, log, or commit token data. If refresh is rejected or scopes are insufficient, run `openclaw kling-ai login` again. Do not retry a generation submission.

Log out while retaining the server definition:

```bash
openclaw kling-ai logout --region global
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
