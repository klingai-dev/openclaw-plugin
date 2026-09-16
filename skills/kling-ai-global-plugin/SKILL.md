---
name: kling-ai-global-plugin
description: Use when a user wants to generate or continue processing image or video tasks with Kling AI in OpenClaw, including status and result queries, uploads, Elements, motion library access, credits, authorization, and account switching. Do not use when only analyzing existing media without calling Kling AI.
---

# Kling AI

Use only the Kling AI MCP service configured by this package at `https://kling.ai/mcp`.

## Routing

- Route text-to-image, image-to-image, posters, covers, product stills, and image concepts to `kling-ai-global-generate-image`.
- Route text-to-video, image-to-video, motion control, animation, camera movement, storyboards, and video concepts to `kling-ai-global-generate-video`.
- Handle OAuth, sign-out and account switching, uploads, motions, Elements, credit queries, cross-media work, and task status in this skill.
- Follow the result-query path for an existing task; do not create a new generation.

An attachment does not define its own role. If the user has not said how to use it, ask whether it is a first frame, identity or product reference, edit source, or style reference.

## Security and submission

- Use only the host MCP OAuth flow. Never request an API key or expose credentials, cookies, authorization headers, private account fields, or signed URLs in logs.
- Use native OpenClaw MCP OAuth. OpenClaw 2026.9.4 identifies the client as `OpenClaw MCP`; do not invent a `client_id` or override registration metadata.
- Resolve required inputs and validate live parameters, then show the final mode, model, dimensions or resolution, duration, and output count. Explain that submission consumes Kling AI credits. Call a generation or motion tool only after explicit confirmation; the initial request is not the final confirmation.
- Submit once per explicit confirmation. Do not retry a failed or ambiguous submission automatically.
- Submission success is not output success. Claim completion only when the task is terminal-success and at least one usable primary media item exists. If work-level `status` is present, it must also be successful.
- Discover tools and mode definitions at runtime. Live provider definitions override examples.
- Upload attachments remotely when required and reuse returned references exactly.
- When OpenClaw mounts the MCP App resource returned by a generation tool, the widget owns status refresh. Do not call `query_tasks` for the same submission. Without a widget, return the current status, task ID, and text fallback without polling.

Read [tool workflows](references/tool-workflows.md) before generating, retrying, or querying. Read the [MCP contract](references/mcp-contract.md) when field details are needed. Read troubleshooting only for authorization, schema, upload, or provider failures.

## Result presentation

- Treat an actually mounted MCP App as the only media preview and refresh owner. Do not assume every channel supports the App.
- Without an App, return a text fallback and at most one primary result link. Never add Markdown image or video embeds manually.
- Use a standalone `MEDIA:<url>` line only when the current channel explicitly supports native media delivery, the user requested an attachment, and no App is mounted.
- Do not create a local MCP server or local UI.
- MCP `tools/list` is the host discovery protocol. Describe only tools that are actually exposed; tool names commonly start with `kling-ai-global__`.

## Workflow

1. Determine whether the request is generation, motion control, Element management, account operation, or read-only query.
2. Create a UUIDv7 `taskTraceId` for a new goal. Reuse it for the same goal and create a new one only for an unrelated goal.
3. Read live `tools/list`; before generation or motion control, call `who_am_i` for complete parameters and media inputs.
4. Ask only for missing creative requirements that materially affect the result.
5. Decide whether this is a new goal, an explicit retry, or an existing-task status request. If a `generationId` exists or submission remains ambiguous, do not route follow-up language into a new generation.
6. Reuse `taskTraceId` across discovery, upload, generation, explicit retry, and query for one goal. Call a generation tool only once per confirmed attempt.
7. Preserve `generationId` and `taskTraceId` exactly. Show `generationId` as the task ID. Neither `creditsConsumed` nor a non-terminal `status` proves completion.
8. If OpenClaw mounts a widget, let that widget call `query_tasks` and update in place. Do not create a second result card.
9. Use the widget as the only media preview. Outside it, add no Markdown media, duplicate attachments, thumbnails, or download links.
10. Without a widget, return the current status, task ID, text fallback, and at most one primary result link. Do not poll. For non-terminal states, say “submitted” or “processing,” not “generated.”
11. When the user later asks to display an existing task, call live `query_result` once if available; otherwise call `query_tasks` once for a UI-free snapshot.
12. Interpret statuses case-insensitively. Filter explicitly failed works. Prefer `urlWithoutWatermark`, then `url`. Cover URLs are thumbnails and do not prove a video exists. If a terminal-success task has no usable work, report the inconsistency and preserve IDs.
13. Delete an Element or sign out/switch accounts only on explicit user request and follow tool confirmation rules.

## Quality defaults

Use these only when the user does not specify an option and the live mode supports them:

- Prefer full-quality models. Use fast, Turbo, or low-cost models only when speed or cost is explicitly prioritized.
- Images: `2k` for normal delivery, `4k` for commercial or detail-heavy work, and `1k` only for drafts or speed.
- Video: `1080p` for normal delivery, `4k` for commercial, large-screen, or post-production work, and `720p` only for drafts, speed, cost, or mode limits.
- Duration: 5 seconds for one action or shot; 10 seconds for dialogue, singing, a complete product action, or two connected beats.
- Text-to-video aspect ratio: `9:16` for vertical short video, `1:1` for square feeds, and `16:9` for landscape ads, web, or YouTube.
- Image-to-video aspect ratio: derive it from the first frame unless the live tool requires a value.

## Failure handling

- Authorization failure: use the native OpenClaw MCP connection flow and retry only after authorization succeeds.
- Invalid model or parameter: refresh the live mode definition and change only unsupported fields.
- Provider failure: report the provider message, preserve `generationId`, and do not resubmit.
- Insufficient credits: tell the user and stop.
- Lost or timed-out submission response: treat creation as unknown. If `generationId` exists, query once when requested. Otherwise use only a live list or trace-query capability. Preserve `taskTraceId`; never replay unless the live tool explicitly guarantees idempotency.
