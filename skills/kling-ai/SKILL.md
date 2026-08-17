---
name: kling-ai
description: Create and monitor Kling AI image and video generations through the OAuth-protected remote Kling MCP server. Use for text-to-image, image-to-image, text-to-video, image-to-video, uploads, task status, and credit checks.
---

# Kling AI

Use the remote `Plugin-OpenClaw-kling-ai` MCP server at `https://klingai.com/mcp`. This plugin contains Skills and OpenClaw configuration only; it does not bundle, start, or depend on a local MCP server.

## Safety and submission contract

- Use OAuth through the host MCP connection flow. Never ask for an API key or expose credentials, cookies, authorization headers, private account fields, or signed URLs in logs.
- Treat generation as a credit-consuming write action. Show the final workflow, model, duration/resolution or aspect ratio, and obtain explicit confirmation immediately before submission unless the current user message explicitly authorizes immediate submission with final settings.
- Submit at most once per approved intent. Do not automatically retry failed or ambiguous submissions.
- Discover the live remote tools and schemas at runtime; the provider schema overrides examples in this Skill.
- Upload attached or local media with the remote upload tool before generation when required. Reuse the returned provider reference exactly as the live schema requires.
- After acceptance, use the remote `query_tasks` tool when status polling is needed. Do not invent a local mock result or claim that a local card will refresh.

Read [references/tool-workflows.md](references/tool-workflows.md) before a generation call. Read troubleshooting guidance only after an authorization, schema, upload, or provider failure.

## OAuth client identity

OpenClaw owns OAuth dynamic client registration and currently sends its host-level `client_name`. This plugin identifies plugin-originated traffic with the non-secret request header `X-Kling-Integration: Plugin-OpenClaw` declared in `openclaw.plugin.json`. The provider uses this telemetry-only marker to distinguish the installed plugin from a manually configured OpenClaw MCP connection. Do not turn it into a tool argument, URL parameter, credential, authentication input, or rollout flag. A missing marker falls back to generic MCP attribution and must not change authorization or generation behavior.

## Workflow

1. Identify the requested generation or read-only operation.
2. Ask only for missing creative requirements that materially affect the result.
3. Confirm the final billable settings.
4. Call the selected remote generation tool exactly once.
5. Preserve and report the exact `generationId` and any `taskTraceId` returned by the provider.
6. If the remote tool returns an MCP App resource, let the host render it and do not duplicate its media. Otherwise, number each primary output in prose and put its OpenClaw native legacy media directive on the following plain line: `MEDIA:<url>`. Never use Markdown image syntax for a result URL, never wrap a `MEDIA:` line in Markdown or a code fence, and keep all prose on separate lines.
7. For a direct status request, call remote `query_tasks` once and report the current state.

## Defaults

Use defaults only when the user did not specify alternatives and the live schema supports them:

- video resolution: `720p`
- video duration: `5` seconds
- text-to-video aspect ratio: `16:9`
- image-to-video aspect ratio: derive from the first frame unless required

## Failure behavior

- Authorization failure: direct the user to the host MCP connection flow, then retry only after authorization succeeds.
- Invalid model or argument: refresh the live schema and revise only the unsupported field.
- Provider task failure: explain the provider message and preserve the `generationId`; do not resubmit.
- Lost or timed-out submission response: treat billing state as unknown and query existing tasks before considering any new submission.
