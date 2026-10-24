# Kling AI for OpenClaw

Generate images and videos with Kling AI directly from OpenClaw.

The plugin connects to Kling AI's official global MCP service through OAuth. It does not require an API key or run a local MCP server.

## Features

- Text-to-image, image-to-image, editing, and controlled variations
- V4 / V4 Flash video, text-to-video, image-to-video, omni reference, keyframes, motion control, and multi-shot video (subject to live account capabilities)
- Reference uploads, Elements, and motion library access
- Account, credit, task status, and result queries
- A final parameter and credit confirmation before each generation request

## V4 support

Recommended: V4. Discover both traditional video entry points and `omni_ref_video`, even for text-only requests, and select a compatible tool/model pair returned by the current account. Image, video, audio, Element, and keyframe support, combination caps, and billing follow live model definitions. Prefer V4 Flash for speed or credit savings; never silently downgrade an explicit V4 request.

[Global ClawHub listing](https://clawhub.ai/klingai-dev/plugins/kling-ai-global-openclaw).

## Install

Requires OpenClaw 2026.9.4 or a compatible release.

```bash
openclaw plugins install clawhub:kling-ai-global-openclaw
```

Check the plugin:

```bash
openclaw plugins inspect kling-ai-global --json
```

Restart the Gateway if the running instance does not load the plugin automatically:

```bash
openclaw gateway restart
```

## Enable interactive UI (MCP Apps)

Plugin installation does not enable OpenClaw's global MCP Apps setting. After installation, enable interactive Kling cards in the Control UI:

```bash
openclaw config set mcp.apps.enabled true --strict-json
openclaw gateway restart
openclaw config get mcp.apps.enabled
```

This permits configured MCP servers to supply interactive HTML. Restarting briefly interrupts the Gateway. A `true` value confirms configuration only; verify the App actually renders. You can ask the agent to follow the packaged Skill for setup. Installing or discovering a Skill does not execute these commands automatically.

Reverse-proxy deployments also need a separate App origin and a sandbox-port proxy: defaults are `18789` for the Gateway and `18790` for Apps. Follow the [official MCP Apps configuration](https://docs.openclaw.ai/cli/mcp/apps) for `mcp.apps.sandboxOrigin`; keep App and Control UI origins distinct. Messaging channels may not embed the UI.

For older hosts, run `openclaw update` and verify with `openclaw --version`. The stable release checked on 2026-10-24 is [2026.10.6](https://github.com/openclaw/openclaw/releases/tag/v2026.10.6), requiring Node 24.22.1+ or 26.12.1+; follow the official updater's guidance. The minimum compatibility baseline remains 2026.9.4. Actual UI acceptance on 2026.10.6 is still pending; upgrading is not a guaranteed fix.

For raw tool text, check the setting, proxy, and session call path. A successful MCP probe does not prove App mounting. Preserve submitted task IDs and never generate again just to repair the UI.

## Existing Global MCP configuration

Version 1.1.20 uses the shared MCP server key `kling-ai`; the plugin ID remains `kling-ai-global`. If you previously registered `kling-ai-global`, sign out with `openclaw mcp logout kling-ai-global` and remove that old operator-managed MCP entry before registering `kling-ai` below. Keep only one regional Kling MCP connection active. If `kling-ai` points to China, sign out and remove that entry before registering Global and authorizing again.

## Sign in

Register the OAuth MCP server once. OpenClaw 2026.9.4 reads `mcp login` targets from its operator-managed MCP configuration:

```bash
openclaw mcp add kling-ai \
  --url https://kling.ai/mcp/plugin \
  --transport streamable-http \
  --auth oauth \
  --connect-timeout 30 \
  --timeout 60 \
  --no-probe
```

Then sign in:

```bash
openclaw mcp login kling-ai
```

Follow the terminal prompt to sign in and authorize Kling AI in your browser. OpenClaw stores and refreshes the OAuth credentials; the plugin does not read or store tokens.

Verify the connection:

```bash
openclaw mcp doctor kling-ai --probe
```

A healthy connection reports `kling-ai: ok`.

## Use

After installation and sign-in, describe what you want in an OpenClaw conversation.

Image example:

```text
Create a 4:5 skincare ad with Kling AI. Place a frosted white serum bottle on a light gray
stone surface, use soft side lighting, leave room for a headline, and do not add people or text.
```

Video example:

```text
Create a 10-second, 16:9, 1080p coffee ad with Kling AI.
Start on a close-up of pour-over coffee and slowly push in. Use warm natural light and no captions.
```

When attaching an image, state how it should be used:

```text
Use this image as the first frame of a 5-second, 9:16 video.
Keep the person, clothing, and background unchanged. Have the person look up gently as the camera pushes in.
```

Before submission, the plugin shows the final model, dimensions or resolution, duration, and output count, and explains that the request consumes Kling AI credits. It creates the task only after explicit confirmation.

To check an existing task:

```text
Check task <generationId>. Do not submit it again.
```

## Update

```bash
openclaw plugins update kling-ai-global
```

Restart the Gateway and open a new conversation if the updated tools do not appear.

## Service region

This branch uses the Kling AI global MCP service:

```text
https://kling.ai/mcp/plugin
```

Regional accounts, credits, and tasks are separate. To switch accounts:

```bash
openclaw mcp logout kling-ai
openclaw mcp login kling-ai
```

## Troubleshooting

```bash
openclaw plugins inspect kling-ai-global --json
openclaw mcp status --verbose
openclaw mcp doctor kling-ai --probe
```

If the tool list is stale:

```bash
openclaw mcp reload
```

If `mcp login` reports `No MCP server named "kling-ai-global"`, run the registration command in [Sign in](#sign-in), then retry login.

Then open a new conversation. If a submission times out or returns an ambiguous result, keep the `generationId` or `taskTraceId` and query the original task instead of submitting it again.

## Development

```bash
git clone https://github.com/klingai-dev/openclaw-plugin.git
cd openclaw-plugin
git switch global
npm test
npm run pack:release
```

Install the local archive:

```bash
openclaw plugins install --force --accept-capabilities ./dist/kling-ai-global-openclaw-1.1.20.zip
```

See [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) for compatibility and validation details.

## License

[MIT](LICENSE)
