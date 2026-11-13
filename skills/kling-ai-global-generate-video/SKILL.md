---
name: kling-ai-global-generate-video
description: Plan and generate Kling AI / 可灵 videos in OpenClaw. Use for prompts, storyboards, missing assets, final settings for approval, and text-to-video, image-to-video, omni reference, keyframes, or motion control.
---

# Kling AI Video Generation

Use only the live tools and mode definitions exposed by the MCP service configured at `https://kling.ai/mcp/plugin`.

## Current deliverable

- **Prompt or storyboard only.** Use [motion and shot planning](references/motion-and-shots.md) to decide whether to edit an existing prompt or guide a new one. Read [scene patterns](references/scene-patterns.md) if scene decisions remain. Finish after delivering the requested text. Omit undiscovered model IDs and submission settings. Skip account discovery, upload, and offers to generate.
- **Missing required asset.** Ask for the asset or an accessible link, explain its role, and stop. For example, ask for the product photo needed as the first frame. Defer other creative questions.
- **Final settings or authorized generation.** Use the workflow below. If the user requests settings for approval, present the proposal and wait. For submission, follow the shared task lifecycle.
- **Existing task.** Follow the shared lifecycle for status or results.

When preparing to generate, on first use or missing UI, follow the [shared MCP Apps setup check](../kling-ai/SKILL.md#mcp-apps-setup-check) before continuing.

## Live V4 capabilities

Before selecting any generation model, follow [capability discovery](../kling-ai/references/capability-discovery.md) and [model parameters](../kling-ai/references/model-parameters.md). For Elements, motion library, or uploads, follow [asset workflows](../kling-ai/references/asset-workflows.md). These live rules supersede static model examples.

If the user has no model preference, say "Recommended: V4" only when the current account returns a compatible V4 model. Prefer full-quality V4 for normal delivery and V4 Flash for speed or credit savings. Respect user-specified models. Follow [video model routing](references/model-routing.md): discover `omni_ref_video` alongside `text_to_video` or `image_to_video`, including pure-text requests. Select one live tool/model pair; never guess identifiers or move models between tools. Explicit V4 requests must not silently fall back.

Omni reference supports only the selected model's declared image, video, audio, Element, and keyframe combinations. Validate `elementSupport`, `combinedItemCaps`, and audio exclusivity (`enable_audio` / `keepOriginalSound`). A single-value `prefer_multi_shots` enum is not a guarantee about shot count. Preserve single-shot intent without sending unsupported values. Disclose per-second billing and included input-video duration when declared; never invent a rate.

## Operating rules

- Use host-managed OAuth. Never request or expose API keys, tokens, cookies, authorization headers, or signed URLs.
- Follow the [shared task lifecycle](../kling-ai/references/tool-workflows.md) for final settings, credit disclosure, and explicit authorization.
- Submit each approved attempt once. Never retry a failed or ambiguous submission automatically.
- Discover tools and mode definitions at runtime. Do not hard-code model names, input roles, duration values, or multi-shot fields from examples.
- Upload attached media with the remote upload tool when needed and preserve the returned reference exactly.

Before submitting, retrying, or querying, read the [shared task lifecycle](../kling-ai/references/tool-workflows.md). Read the [MCP contract](../kling-ai/references/mcp-contract.md) when field details are needed, and let the current `tools/list` and `who_am_i` override dynamic values in the snapshot.

## Workflow

When resuming after a top-up, follow the [resume workflow](../kling-ai/references/tool-workflows.md#resume-after-insufficient-credits) for any existing task before preparing a new submission.

1. Record the requested model or family, duration, aspect ratio, resolution, count, sound, shot structure, and each reference role. Ask only about gaps that materially affect the result. Create or reuse one UUIDv7 `taskTraceId` for the goal.
2. Discover candidate tools through OpenClaw and check their models with `who_am_i`. Apply video routing and keep only pairs that meet all required settings and input roles. A first-frame requirement needs a declared first-frame input. Apply sound eligibility before ranking, including for text-only omni. If no pair fits, report the unmet requirement and stop. Consider other models only if the user permits them.
3. Read the selected tool's complete live `inputSchema` through the host. Use [model parameters](../kling-ai/references/model-parameters.md) to bind each explicit supported setting to its own argument. Prepare media after selecting the pair. Stop if a required upload fails.
4. For each new generation, edit, or variation, read [motion and shot planning](references/motion-and-shots.md). Reuse a suitable prompt verbatim, make targeted edits, or write a new prompt as needed. Read [scene patterns](references/scene-patterns.md) if scene decisions remain. Status checks and authorized retries with unchanged parameters do not require a prompt review.
5. Check the actual request for the top-level `model`, required prompt, and first-frame slot. For an explicit resolution such as `1080p`, check the enum and conditions for the same tool and selected model. Follow the shared lifecycle to present the proposal and submit once after approval and the credit check.

## Modes

| User intent | Mode | Interpretation |
| --- | --- | --- |
| Text-to-video | Generation | Define the opening composition from text without a source image controlling the first frame. |
| Image-to-video | Image-guided video | Use one or more images as first frame, last frame, identity, product, or visual references. Assign each input a role. |
| Motion control | Motion transfer | A subject image is required. Use either a library `motionId` or a source video, never both. |
| Multi-shot / storyboard | One approved video plan | Divide timing and continuity deliberately. Do not submit one task per shot unless the user explicitly approves separate tasks. |
| Status request | Read-only | Query the existing task; do not call a generation tool. |

For image-to-video, distinguish first frame, last frame, identity or product reference, and style reference. Do not downgrade to text-to-video after an upload, reference-count, or schema error.

Before calling a tool, check mode, reference roles, duration, resolution, shot structure, and protected elements, then follow the shared lifecycle’s approval rules.

## Quality defaults

- Use `1080p` for normal delivery, `4k` for high-quality, commercial, large-screen, or post-production work when supported, and `720p` only for drafts, speed, cost, or modes that support no higher resolution.
- Use 5 seconds for one action or shot; prefer 10 seconds for dialogue, singing, a complete product action, or two connected beats. Use longer durations only when supported and necessary.
- Choose text-to-video aspect ratio by placement: `9:16` for vertical short video, `1:1` for square feeds, and `16:9` for landscape ads, web, or YouTube.
- Pass an explicitly requested, supported ratio even with a first frame. With no requested ratio, preserve first-frame composition unless the live tool requires a ratio.
- Prefer one continuous shot for one moment. Use multiple shots only when the story changes place, time, scale, or information state, or when requested.
- Keep the first generation focused. Do not add narration, on-screen text, extra characters, or product claims that the user did not request.

## Quality gate

Before submission, check that the action fits the duration, camera instructions do not conflict, first- and last-frame intent is clear, identity or product structure is protected, and multi-shot timing forms a coherent whole.

## Failure handling

- Authorization failure: direct the user to the native OpenClaw MCP connection flow.
- Invalid model or parameter: refresh the live mode definition and change only unsupported fields.
- Invalid resource in image-to-video or omni reference: use [media reference recovery](../kling-ai/references/troubleshooting.md#upload-or-media-reference-failure) to check first-frame and reference bindings. Source-image or reference-work IDs only identify source assets.
- Insufficient credits: follow the [resume workflow](../kling-ai/references/tool-workflows.md#resume-after-insufficient-credits) and retain the original model, settings, prompt, and references. When the user explicitly continues, recheck the original first-frame slot and media validity.
- Lost response: recover or report unknown according to the shared lifecycle; never replay blindly.
- Provider failure: report the message and preserve all IDs; do not resubmit automatically.
