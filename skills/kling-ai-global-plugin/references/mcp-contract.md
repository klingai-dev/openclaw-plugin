# Kling AI MCP input and output contract

Use this file to check tool surfaces and parameter structure without freezing dynamic model configuration. Read facts in this order:

1. The connected `tools/list` defines callable tools, descriptions, and `inputSchema`.
2. `who_am_i.availableModels` defines each generation tool's models, parameters, required fields, defaults, enums, limits, and media inputs.
3. Actual tool responses define newly observed output fields. Do not invent fields without an `outputSchema` or real response.

## Tool inventory

- Discovery and account: `who_am_i`, `query_membership_and_credits`, `logout`
- Generation and query: `text_to_image`, `image_to_image`, `text_to_video`, `image_to_video`, `motion_control`, `query_tasks`, and optional live `query_result`
- Media and reuse: `file_upload`, `motion_library_list`, `element_create`, `element_list`, `element_get`, `element_update`, `element_delete`

Call only tools present in the current `tools/list`. Tools, models, and value ranges may differ by region or account tier.

## Fixed tool-level inputs

- Five generation tools: `model`, `arguments[]`, `inputs[]`, `rationale`, `taskTraceId`.
  - `model` must come from the current `who_am_i` listing for that tool.
  - Each `arguments[]` item is `{name, value}`; every `value` is a string. Names, requirements, defaults, enums, and limits come from the selected model.
  - Each `inputs[]` item is `{name, inputType, url}`; send only names declared by the selected model and use the live schema's `inputType`.
  - `rationale` explains the goal and parameter choice; it does not replace the user prompt.
- `query_tasks`: required `generationId`, optional `taskTraceId`.
- `query_result`: when available, use the same task identifiers to mount an existing task as a Generation Widget. It is for one-time display, not widget refresh.
- `file_upload`: pass `filename`, `contentType`, `size`, and `taskTraceId` according to the live schema.
- `who_am_i`, `query_membership_and_credits`, `logout`, `motion_library_list`, and `element_list`: optional `taskTraceId` only.
- `element_get`, `element_delete`: `id` and optional `taskTraceId`; check live required fields.
- `element_create`: `name`, `description`, `resource`, `tags`, `taskTraceId`.
- `element_update`: create fields plus `id`. Call `element_get` first, then update the complete object to avoid clearing omitted fields.

Use an RFC 4122 UUIDv7 `taskTraceId`. Reuse it across discovery, upload, generation, explicit retry, and query for one goal. Every generation still receives its own `generationId`. Preserve the trace when a result is ambiguous, but never replay unless the live tool guarantees idempotency.

## Dynamic model parameters

Before generation, call `who_am_i` and read:

- `arguments[]`: `name`, `required`, `default`, `allowedValues` or `allowed_values`, `maxItems`, and `description`
- `inputs[]`: `name`, `required`, and `description`
- Model aliases are for interpreting intent only; submit the canonical `model` name.

See the [model parameter snapshot](model-parameters.md) for current names and limits. Live `who_am_i` always wins. When tool-level instructions conflict with `who_am_i`, apply the stricter restriction and stop an unsafe submission.

Required gates:

- Do not use Elements with `text_to_image` or `text_to_video`.
- Read an Element with `element_get` first. Use image Elements only with a live image-to-image or image-to-video model that supports `elements`; use video Elements only with a supported image-to-video model.
- `motion_control` requires subject `image` and exactly one of library `motionId` or source `video`.
- When a model requires a URL from `file_upload`, do not pass a local path or arbitrary external URL.
- Do not pass undeclared parameters, input names, or enum values.

## Element resources

- Image Element: `resource.cover` plus 1–3 `resource.secondary[{name,inputType,url}]`; do not combine with `resource.video`.
- Video Element: `resource.video`, optionally `resource.voice` when supported; do not combine with `cover` or `secondary`.
- Supply at least one `tag`, using only tags allowed by the live tool.
- `element_delete` removes user media and requires explicit confirmation.
- If the primary image cannot be replaced safely through update, explain that delete-and-recreate is required and wait for confirmation.

## Known outputs

- Generation submission: `generationId`, `status`, and possibly `creditsConsumed` and `message`. This proves acceptance or task creation, not completion.
- `query_tasks`: `generationId`, `status`, `createTime`, `finishTime`, `works[]`. Works may contain `status`, `contentType`, `url`, `urlWithoutWatermark`, `coverUrl`, and `coverUrlWithoutWatermark`.
- Claim completion only for a terminal-success task with at least one usable `urlWithoutWatermark` or `url`. A cover URL is not proof of a completed video.
- Terminal success without usable work is inconsistent output. Report it, preserve IDs, and do not create a replacement task.
- Without `generationId`, `query_tasks` cannot locate a submission by `taskTraceId` alone. Use only a live list or trace-query tool; “cannot query” does not mean “not created.”
- `file_upload` first returns `ticket`, `uploadUrl`, and `expireAt`; the caller then sends multipart form data containing the ticket and file bytes and reads the uploaded URL.
- `query_membership_and_credits`: `userId`, `membershipType`, `availableRemainCredits`.
- `motion_library_list`: `motions[{id,name,motionUrl,coverUrl,duration,hasAudio}]`, with `duration` in milliseconds.
- `element_list`: `elements[{id,name}]`.
- `element_get`: `id`, `name`, `description`, `resource`, `tags`.
- `element_create`: returns an Element `id` according to the tool contract.

Do not claim undeclared output fields for `element_update`, `element_delete`, or `logout`; use the real response as returned.

## MCP App widget contract

- Generation tools that need UI link a stable `ui://` resource through preferred `_meta.ui.resourceUri`; servers may also expose legacy `_meta["ui/resourceUri"]`.
- The remote Kling AI MCP serves `text/html;profile=mcp-app` through `resources/list` and `resources/read`. This package does not copy the HTML.
- Tool results keep a text fallback and structured widget data so hosts without UI can still understand the call.
- `element_list` and `file_upload` are non-visual flows and must not reserve empty widgets.
- After OpenClaw mounts a widget, it passes tool input and result to the component and lets it call `query_tasks` through the standard MCP Apps bridge. The widget is the only refresh owner and media preview.
- The model must not call `query_tasks` or `query_result` for the same mounted submission.
- Without a widget, return only the submission result or one explicitly requested query snapshot. Never turn a non-terminal snapshot into a polling loop or describe it as complete.
