# Kling AI for OpenClaw

Use your global Kling AI account to generate images and videos in OpenClaw. The plugin connects to Kling AI's official MCP service through OAuth, with no API key required.

[Global ClawHub](https://clawhub.ai/klingai-dev/plugins/kling-ai-global-openclaw) · [Official Kling MCP and CLI guide](https://kling.ai/app/mcp/guide) · [China edition README](https://github.com/klingai-dev/openclaw-plugin#readme)

## Quick start

You need OpenClaw `2026.9.4` or a newer compatible release and a global Kling AI account. Use one Kling integration and one account region per OpenClaw instance. [OpenClaw installation guide](https://docs.openclaw.ai/install)

### Ask OpenClaw to set it up

Send this prompt to an OpenClaw agent that can run terminal commands in the Gateway environment. Use your global Kling AI account when the browser asks you to authorize.

```text
Set up the global Kling AI plugin using https://github.com/klingai-dev/openclaw-plugin/tree/global#readme.
Run openclaw plugins install clawhub:kling-ai-global-openclaw, register the kling-ai MCP service
as described in the README, guide me through browser authorization, and verify the connection by checking available Kling models.
```

### Install

For manual setup, run the following command in the environment where your OpenClaw Gateway runs.

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

### Sign in

Register the global plugin's MCP service once so the OpenClaw login command can find it. If you already have a Kling MCP entry, check [Service region](#service-region) before registering.

```bash
openclaw mcp add kling-ai \
  --url https://kling.ai/mcp/plugin \
  --transport streamable-http \
  --auth oauth \
  --header X-Kling-Integration=Plugin-OpenClaw \
  --connect-timeout 30 \
  --timeout 60 \
  --no-probe
```

Then sign in:

```bash
openclaw mcp login kling-ai
```

Open the authorization link from the terminal and sign in with your global Kling AI account. OpenClaw manages the OAuth credentials.

Check the saved configuration and sign-in state. When the command reports `kling-ai: ok`, try Kling in a new conversation.

```bash
openclaw mcp doctor kling-ai
```

### Generate your first image

Start a new OpenClaw conversation and send this prompt.

```text
Use Kling AI to generate a square image of a cup of coffee by a window in soft morning light, in a realistic photography style.
```

Review the model, settings, and credit notice, then reply “Confirm generation” to submit. When the task finishes, view the image or open its result link in the conversation.

## Enable interactive UI (MCP Apps)

Plugin installation does not enable OpenClaw's global MCP Apps setting. After installation, enable interactive Kling cards in the Control UI:

```bash
openclaw config set mcp.apps.enabled true --strict-json
openclaw gateway restart
openclaw config get mcp.apps.enabled
```

This permits configured MCP servers to supply interactive HTML. Restarting briefly interrupts the Gateway. A `true` value confirms configuration only; verify the App actually renders. You can ask the agent to follow the packaged Skill for setup. Installing or discovering a Skill does not execute these commands automatically.

Reverse-proxy deployments also need a separate App origin and a sandbox-port proxy: defaults are `18789` for the Gateway and `18790` for Apps. Follow the [official MCP Apps configuration](https://docs.openclaw.ai/cli/mcp/apps) for `mcp.apps.sandboxOrigin`; keep App and Control UI origins distinct. Messaging channels may not embed the UI.

If your OpenClaw version is below the compatibility baseline, follow the official update instructions and check it with `openclaw --version`. [OpenClaw update guide](https://docs.openclaw.ai/install/updating)

For raw tool text, check the setting, proxy, and session call path. A successful MCP probe does not prove App mounting. Preserve submitted task IDs and never generate again just to repair the UI.

## Features

- Text-to-image, reference-guided editing, controlled variations, and image series. Kling Image 4.0 supports native 8K. Check the connected account's live model definition for available resolutions and series lengths. [Official Kling Image 4.0 guide](https://kling.ai/quickstart/kling-image-4-user-guide)
- Text-to-video, image-to-video, Omni-Ref, keyframes, motion control, and multi-shot video
- Reference uploads, Elements, and motion library access
- Account, credit, task status, and result queries
- A final parameter and credit confirmation before each generation request

## Video generation

- **Kling 4.0 (V4)** supports text-to-video, image-to-video with first, last, and intermediate keyframes, and Omni-Ref with images, videos, audio, and Elements. It supports 3–30 seconds at 720p, with 1080p or 4K available when declared for eligible accounts.
- **HDR video** is available with standard Kling 4.0 for text-to-video, image-to-video, and Omni-Ref. Ask for 1080p HDR or 4K HDR, and the plugin checks the connected account's live model capabilities. 720p and Kling 4.0 Flash do not support HDR.
- **Kling 4.0 Flash (V4 Flash)** is designed for fast generation. It supports text-to-video, image-to-video with a single first frame, and Omni-Ref with images, videos, and Elements. It supports 3–20 seconds at 720p.
- Both Omni-Ref models support smart shot splitting, synchronized sound generation, and preservation of source-video audio. The two audio output settings are mutually exclusive. For a separate audio reference, select a Kling 4.0 Omni-Ref model that declares audio input.

## Use

When no image model is specified, prefer Kling Image 4.0 if it is available to the current account and fits the request. If 4.0 is unavailable or incompatible, prefer the image tool's compatible live default.

When no video model is specified, prefer Kling 4.0 Omni-Ref if the connected account offers it and it fits the request. A compatible Flash model can serve requests that prioritize speed or credit savings. The plugin checks both text-to-video and Omni-Ref for text-only video requests.

The plugin matches explicitly requested models by their full names in live discovery. Live model definitions govern settings, reference combinations, and billing.

### Recommended prompts

- Use Kling Image 4.0 to generate a series of three 8K images in one request. Show the same red panda in a vintage spacesuit exiting a space station, drifting past a porthole, and turning to look at the blue Earth.
- Use Kling 4.0 to generate a 20‑second cinematic video: a mech warrior slams down from height onto the ground, sending out a shockwave that instantly blasts apart rubble and dust, with the camera rapidly pushing in for a powerful impact.
- Use Kling 4.0 Flash to turn my sneaker product photo into a 20-second, 720p video. Start from the photo, slowly orbit the shoe, and end on a close-up of the upper.
- Use Kling AI to browse the motion library and preview saved motions; after I select one, apply it to my subject image with an available motion-control model to generate a video.
- Use Kling AI to save the front and side views of my character as my first reusable Element, named “Xiaobai”, to help keep the character consistent in later creations.

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

Regional accounts, credits, and tasks are separate. Use `openclaw mcp show kling-ai` to check the saved URL. If `kling-ai` points to the China service, sign out with `openclaw mcp logout kling-ai` and remove the old manually registered entry with `openclaw mcp unset kling-ai`. Then [register the global URL and sign in](#sign-in).

Older global setups may have registered the MCP service as `kling-ai-global`. For those setups, sign out with `openclaw mcp logout kling-ai-global`, remove the old entry with `openclaw mcp unset kling-ai-global`, and [register and sign in as `kling-ai`](#sign-in). The global plugin ID is `kling-ai-global`.

To switch between global accounts, run:

```bash
openclaw mcp logout kling-ai
openclaw mcp login kling-ai
```

To open the browser automatically, run this from the installed plugin directory:

```bash
npm run login
```

The bundled helper runs the OpenClaw sign-in flow and opens the global Kling authorization page. If the browser fails to open, run `openclaw mcp login kling-ai` and paste the authorization link from the terminal into your browser.

## Names and underscores

OpenClaw's MCP registration names and code-mode callable names differ. Registration can retain `kling-ai__text_to_image`; code mode replaces characters invalid in JavaScript identifiers with underscores, so the server identifier may appear as `kling_ai`. Use the current session's tool or namespace declaration rather than constructing a prefix.

This does not rename installation or configuration identities. Keep the MCP server key `kling-ai`, plugin IDs, Skill names, and package names as declared in this package. Do not change `openclaw mcp login kling-ai` to an underscore spelling.

References: [MCP tool naming](https://docs.openclaw.ai/plugins/bundles#tool-naming), [code-mode naming](https://docs.openclaw.ai/tools/code-mode/tool-surface).

## Troubleshooting

```bash
openclaw plugins inspect kling-ai-global --json
openclaw mcp status --verbose
openclaw mcp doctor kling-ai
```

For a live connection check, run `openclaw mcp doctor kling-ai --probe` while the Gateway is stopped. [OpenClaw MCP command reference](https://docs.openclaw.ai/cli/mcp/registry)

- **Login cannot find `kling-ai`**. Run the registration command in [Sign in](#sign-in), then retry.
- **Kling tools are missing from the conversation**. Start a new conversation. If the tools are still missing, restart the Gateway and try again.
- **The response shows text instead of an interactive card**. Check the [MCP Apps settings](#enable-interactive-ui-mcp-apps).
- **A submission times out or returns an ambiguous result**. Check the existing task with its original `generationId`. If no task ID is available, keep the `taskTraceId` and treat the submission as unconfirmed.

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
openclaw plugins install --force --accept-capabilities ./dist/kling-ai-global-openclaw-1.1.29.zip
```

See [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) for compatibility and validation details.

## License

[MIT](LICENSE)
