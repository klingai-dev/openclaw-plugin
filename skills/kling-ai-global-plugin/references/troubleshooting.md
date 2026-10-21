# OpenClaw troubleshooting

## Missing tools or authorization

Configure the single `kling-ai-global` service with `openclaw mcp add` as described in the root README, then run `openclaw mcp login kling-ai-global`. OpenClaw 2026.9.4 resolves `mcp login` from its operator-managed MCP configuration even though the plugin manifest also contributes the same server to agent runtimes. Use `openclaw plugins inspect kling-ai-global` to inspect the bundle, then `openclaw mcp doctor kling-ai-global --probe` to test the saved connection. Never request an API key, token, cookie, or full authorization header.

OpenClaw 2026.9.4 uses `OpenClaw MCP` as the dynamic registration `client_name`. If registration or callback fails, report a redacted error. Do not invent a `client_id`, `oauth_resource`, scope, or separate auth proxy.

## Tasks and results

A submission timeout is not a failure. Never replay automatically. With `generationId`, query once when requested. Without an ID or a supported lookup, report unknown and preserve `taskTraceId`. Stop on insufficient credits, rate limits, or provider failure.

When an App is mounted, let it refresh and do not query again. Without an App, return text and at most one primary result link. Do not treat a video cover as a video or an accepted state as completion. Historical media links may expire; refresh the existing task according to the live contract.

## Media inputs

Use only media references accepted by the current model. Upload only when a live upload tool and the host support file reading and transfer. A local path is not a remote image URL. Take parameter and model values from the live schema.

## Model capability mismatch

If a requested V4 model is missing, complete discovery across relevant video tools including `omni_ref_video`, then refresh `who_am_i` after reconnecting or entitlement changes. A filtered response cannot establish absence on unqueried tools. Report only that the current connection did not return a compatible model; do not claim the account lacks permission, guess an identifier, or submit a paid probe.
