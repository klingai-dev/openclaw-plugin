# OpenClaw troubleshooting

## Missing tools or authorization

Configure the single `kling-ai` service as described in the root README and run `openclaw mcp login kling-ai`. Use `openclaw plugins inspect kling-ai` to inspect the bundle, then `openclaw mcp doctor kling-ai --probe` to test the saved connection. Never request an API key, token, cookie, or full authorization header.

OpenClaw 2026.9.4 uses `OpenClaw MCP` as the dynamic registration `client_name`. If registration or callback fails, report a redacted error. Do not invent a `client_id`, `oauth_resource`, scope, or separate auth proxy.

## Tasks and results

A submission timeout is not a failure. Never replay automatically. With `generationId`, query once when requested. Without an ID or a supported lookup, report unknown and preserve `taskTraceId`. Stop on insufficient credits, rate limits, or provider failure.

When an App is mounted, let it refresh and do not query again. Without an App, return text and at most one primary result link. Do not treat a video cover as a video or an accepted state as completion. Historical media links may expire; refresh the existing task according to the live contract.

## Media inputs

Use only media references accepted by the current model. Upload only when a live upload tool and the host support file reading and transfer. A local path is not a remote image URL. Take parameter and model values from the live schema.
