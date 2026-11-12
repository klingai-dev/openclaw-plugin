# OpenClaw troubleshooting

## Missing tools or authorization

Configure the single `kling-ai` service with `openclaw mcp add` as described in the root README, then run `openclaw mcp login kling-ai`. OpenClaw 2026.9.4 resolves `mcp login` from its operator-managed MCP configuration even though the plugin manifest also contributes the same server to agent runtimes. Use `openclaw plugins inspect kling-ai-global` to inspect the bundle, then `openclaw mcp doctor kling-ai --probe` to test the saved connection. Never request an API key, token, cookie, or full authorization header.

OpenClaw 2026.9.4 uses `OpenClaw MCP` as the dynamic registration `client_name`. If registration or callback fails, report a redacted error. Do not invent a `client_id`, `oauth_resource`, scope, or separate auth proxy.

## Tasks and results

Treat submission timeouts and generic “service unavailable” messages as service errors, even when the outer code is `InvalidParameter`. If this attempt has a `generationId`, use the [existing-task flow](tool-workflows.md#4-keep-one-refresh-owner). If the outcome is ambiguous and there is no task ID, keep `taskTraceId` and report unconfirmed creation or billing. Use field validation only when the error identifies a specific field.

When an App is mounted, let it refresh and do not query again. Without an App, return text and at most one primary result link. Do not treat a video cover as a video or an accepted state as completion. Historical media links may expire; refresh the existing task according to the live contract.

When the generation queue is full, keep the settings and any known task ID. Report whether the service confirmed queuing. If the user later asks to continue, handle any known original task first. If a status query is rate-limited, stop querying and report the task ID and last confirmed status. For insufficient credits, follow the [resume workflow](tool-workflows.md#resume-after-insufficient-credits) and distinguish a pre-submission pause, an explicit service rejection, and an unconfirmed submission.

## Parameter or resolution validation failure

- Inspect the actual request for a missing or empty top-level `model`, then check all required `arguments[]` items and `inputs[]` slots against the live definitions. Bind `image_1` or `first_image` only as declared by the selected model.
- For a resolution rejection, refresh `who_am_i` for the same connection, tool, and model. Compare the actual value with its enum and conditions. If a matching request is still rejected, retain redacted fields and `taskTraceId`. If the requested resolution is unavailable, ask the user to choose a supported option before any further submission.
- To locate a field change, compare the same attempt's original model tool arguments, OpenClaw's actual MCP request, and the live tool schema's `required` list where available. Record missing samples and retain only redacted details.

## Upload or media reference failure

Use only media references accepted by the current model. Upload only when a live upload tool and the host support file reading and transfer. A local path is not a remote image URL. Take parameter and model values from the live schema.

- If the error identifies a slot, media reference, or signature, use the [upload rules](asset-workflows.md#local-media-uploads) to check the actual input against the successful upload response. If no generation call has been sent, correct the reference and follow the normal submission steps.
- If the error says to retry with the same generation ID, recover status using only a `generationId` confirmed for this attempt. Use its mounted widget or follow the [existing-task query flow](tool-workflows.md#4-keep-one-refresh-owner). A source-work, upload, or other step's ID cannot identify this attempt. If no ID can be confirmed, keep `taskTraceId` and report unconfirmed creation and billing.
- To locate a URL change, compare available samples from the same attempt's successful upload response, model tool arguments, and actual OpenClaw MCP request. Retain only redacted URL summaries and query parameter names, and record missing samples. `ResourceNotFound` alone does not identify where the failure occurred.

## Model capability mismatch

If a requested V4 model is missing, complete discovery across relevant video tools including `omni_ref_video`, then refresh `who_am_i` after reconnecting or entitlement changes. A filtered response cannot establish absence on unqueried tools. Report only that the current connection did not return a compatible model; do not claim the account lacks permission, guess an identifier, or submit a paid probe.
