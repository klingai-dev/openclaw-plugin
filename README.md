# Kling AI for OpenClaw

Generate images and videos with Kling AI directly from OpenClaw.

The plugin connects to Kling AI's official global MCP service through OAuth. It does not require an API key or run a local MCP server.

## Features

- Text-to-image, image-to-image, editing, and controlled variations
- Text-to-video, image-to-video, motion control, and multi-shot video
- Reference uploads, Elements, and motion library access
- Account, credit, task status, and result queries
- A final parameter and credit confirmation before each generation request

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

## Sign in

Register the OAuth MCP server once. OpenClaw 2026.9.4 reads `mcp login` targets from its operator-managed MCP configuration:

```bash
openclaw mcp add kling-ai-global \
  --url https://kling.ai/mcp/plugin/ \
  --transport streamable-http \
  --auth oauth \
  --connect-timeout 30 \
  --timeout 60 \
  --no-probe
```

Then sign in:

```bash
openclaw mcp login kling-ai-global
```

Follow the terminal prompt to sign in and authorize Kling AI in your browser. OpenClaw stores and refreshes the OAuth credentials; the plugin does not read or store tokens.

Verify the connection:

```bash
openclaw mcp doctor kling-ai-global --probe
```

A healthy connection reports `kling-ai-global: ok`.

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
https://kling.ai/mcp/plugin/
```

Regional accounts, credits, and tasks are separate. To switch accounts:

```bash
openclaw mcp logout kling-ai-global
openclaw mcp login kling-ai-global
```

## Troubleshooting

```bash
openclaw plugins inspect kling-ai-global --json
openclaw mcp status --verbose
openclaw mcp doctor kling-ai-global --probe
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
openclaw plugins install --force --accept-capabilities ./dist/kling-ai-global-openclaw-1.1.16.zip
```

See [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) for compatibility and validation details.

## License

[MIT](LICENSE)
