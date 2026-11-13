# Kling AI for OpenClaw

Generate images and videos with Kling AI directly from OpenClaw.

The plugin connects to Kling AI's official global MCP service through OAuth. It does not require an API key or run a local MCP server.

## Features

- Text-to-image, reference-guided editing, controlled variations, and image series where supported
- Text-to-video, image-to-video, Omni-Ref, keyframes, motion control, and multi-shot video
- Reference uploads, Elements, and motion library access
- Account, credit, task status, and result queries
- A final parameter and credit confirmation before each generation request

## Kling 4.0 and Kling 4.0 Flash

- **Kling 4.0 (V4)** supports text-to-video, image-to-video with first, last, and intermediate keyframes, and Omni-Ref with images, videos, audio, and Elements. It supports 3–30 seconds at 720p, with 1080p available to eligible accounts.
- **Kling 4.0 Flash (V4 Flash)** is designed for fast generation. It supports text-to-video, image-to-video with a single first frame, and Omni-Ref with images, videos, and Elements. It supports 3–20 seconds at 720p.
- Both Omni-Ref models support smart shot splitting, synchronized sound generation, and preservation of source-video audio. The two audio output settings are mutually exclusive. For a separate audio reference, select a Kling 4.0 Omni-Ref model that declares audio input.

When no model is specified, prefer Kling 4.0 Omni-Ref if the connected account offers it and it fits the request. A compatible Flash model can serve requests that prioritize speed or credit savings. The plugin checks traditional video tools and `omni_ref_video` even for text-only requests. It matches explicitly requested models by their full names in live discovery. Live model definitions govern settings, reference combinations, and billing.

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

Version 1.1.23 uses the shared MCP server key `kling-ai`; the plugin ID remains `kling-ai-global`. If you previously registered `kling-ai-global`, sign out with `openclaw mcp logout kling-ai-global` and remove that old operator-managed MCP entry before registering `kling-ai` below. Keep only one regional Kling MCP connection active. If `kling-ai` points to China, sign out and remove that entry before registering Global and authorizing again.

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

To open the browser automatically, run this from the installed plugin directory:

```bash
npm run login
```

The bundled helper invokes the same OpenClaw login flow and opens the global Kling authorization page. OpenClaw still owns the callback and credentials. The native `openclaw mcp login kling-ai` command only prints the authorization URL; clickable links and underlines depend on the terminal. If automatic opening fails, follow the helper's instruction to use the native command and copy its link into a browser.


Verify the connection:

```bash
openclaw mcp doctor kling-ai --probe
```

A healthy connection reports `kling-ai: ok`.

## Use

After installation and sign-in, describe what you want in an OpenClaw conversation.

### Recommended prompts

- Use Kling to generate a series of three images in one request. Show the same red panda in a vintage spacesuit exiting a space station, drifting past a porthole, and turning to look at the blue Earth.
- Use Kling 4.0 to generate a 20‑second cinematic video: a mech warrior slams down from height onto the ground, sending out a shockwave that instantly blasts apart rubble and dust, with the camera rapidly pushing in for a powerful impact.
- Use Kling 4.0 Flash to turn my sneaker product photo into a 20-second, 720p video. Start from the photo, slowly orbit the shoe, and end on a close-up of the upper.
- Use Kling AI to browse the motion library and preview saved motions; after I select one, apply it to my subject image with an available motion-control model to generate a video.
- Use Kling AI to save the front and side views of my character as my first reusable Element, named “Xiaobai”, to help keep the character consistent in later creations.

When no image model is specified, prefer the live default for the selected image tool if it fits the request.

Before submission, the plugin shows the final model, dimensions or resolution, duration, and output count, and explains that the request consumes Kling AI credits. It creates the task only after explicit confirmation.

If you run out of credits, use the official top-up link returned by the connection or sign in to the same account at the [Kling AI global site](https://kling.ai/). After topping up, return to the same conversation and say “Continue my last generation.” OpenClaw handles any existing task first. It checks credits and resumes the original settings when a new submission is allowed.

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

## Names and underscores

OpenClaw's MCP registration names and code-mode callable names differ. Registration can retain `kling-ai__text_to_image`; code mode replaces characters invalid in JavaScript identifiers with underscores, so the server identifier may appear as `kling_ai`. Use the current session's tool or namespace declaration rather than constructing a prefix.

This does not rename installation or configuration identities. Keep the MCP server key `kling-ai`, plugin IDs, Skill names, and package names as declared in this package. Do not change `openclaw mcp login kling-ai` to an underscore spelling.

References: [MCP tool naming](https://docs.openclaw.ai/plugins/bundles#tool-naming), [code-mode naming](https://docs.openclaw.ai/tools/code-mode/tool-surface).

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

Then open a new conversation. If a submission times out or returns an ambiguous result, use the original `generationId` to check that task. If no task ID is available, keep the `taskTraceId` and treat the submission as unconfirmed.

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
openclaw plugins install --force --accept-capabilities ./dist/kling-ai-global-openclaw-1.1.27.zip
```

See [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) for compatibility and validation details.

## License

[MIT](LICENSE)
