---
name: kling-ai-global-generate-video
description: Use when a user wants Kling AI V4 / V4 Flash, text-to-video, image-to-video, omni reference, keyframes, audio-guided video, motion control, or single-shot and multi-shot video generation in OpenClaw, including product demos, ads, short films, and social content. Existing task status and result requests follow the shared task lifecycle.
---

# Kling AI Video Generation

Turn the user's request into a coherent motion plan and one approved remote generation request. Use only the live tools and mode definitions exposed by the MCP service configured at `https://kling.ai/mcp/plugin`.

On first use or missing UI, follow the [shared MCP Apps setup check](../kling-ai-global-plugin/SKILL.md#mcp-apps-setup-check) before continuing.

## Live V4 capabilities

Before selecting any generation model, follow [capability discovery](../kling-ai-global-plugin/references/capability-discovery.md) and [model parameters](../kling-ai-global-plugin/references/model-parameters.md). For Elements, motion library, or uploads, follow [asset workflows](../kling-ai-global-plugin/references/asset-workflows.md). These live rules supersede static model examples.

V4 is generally available. Say "Recommended: V4" when a compatible V4 model is returned by the current account; prefer full-quality V4 for normal delivery and V4 Flash for speed or credit savings. Respect user-specified models. Follow [video model routing](references/model-routing.md): discover `omni_ref_video` alongside `text_to_video` or `image_to_video`, including pure-text requests. Select one live tool/model pair; never guess identifiers or move models between tools. Explicit V4 requests must not silently fall back.

Omni reference supports only the selected model's declared image, video, audio, Element, and keyframe combinations. Validate `elementSupport`, `combinedItemCaps`, and audio exclusivity (`enable_audio` / `keepOriginalSound`). A single-value `prefer_multi_shots` enum is not a guarantee about shot count. Preserve single-shot intent without sending unsupported values. Disclose per-second billing and included input-video duration when declared; never invent a rate.

## Operating rules

- Use host-managed OAuth. Never request or expose API keys, tokens, cookies, authorization headers, or signed URLs.
- Resolve required inputs and validate live parameters, then show the final mode, model, resolution, aspect ratio, duration, and output count. Explain that submission consumes Kling AI credits. Call a generation or motion tool only after explicit confirmation; the initial request is not the final confirmation.
- Submit each approved attempt once. Never retry a failed or ambiguous submission automatically.
- Discover tools and mode definitions at runtime. Do not hard-code model names, input roles, duration values, or multi-shot fields from examples.
- Upload attached media with the remote upload tool when needed and preserve the returned reference exactly.

Before submitting, retrying, or querying, read the [shared task lifecycle](../kling-ai-global-plugin/references/tool-workflows.md). Read the [MCP contract](../kling-ai-global-plugin/references/mcp-contract.md) when field details are needed, and let the current `tools/list` and `who_am_i` override dynamic values in the snapshot.

## Workflow

1. Classify the request with the mode table below.
2. Read the [scene pattern](references/scene-patterns.md) that matches the target format.
3. For shot timing, image-to-video constraints, multi-shot continuity, or timed narration, read [motion and shot planning](references/motion-and-shots.md).
4. Ask only for missing creative details that materially affect the result: duration, placement aspect ratio, required reference media, narration or copy, or shot structure.
5. Among live models that support the mode, references, and duration, prefer full-quality models. Use fast, Turbo, or low-cost models only when the user explicitly prioritizes drafts, speed, or credit savings.
6. Build a motion-first prompt covering subject action, camera movement, environmental motion, timing, continuity, and protected elements. Convert abstract requirements into concrete camera, lighting, material, depth-of-field, pacing, and composition choices.
7. Follow the shared lifecycle: reuse `taskTraceId` for one goal and call a video or motion tool at most once per confirmed attempt.

## Modes

| User intent | Mode | Interpretation |
| --- | --- | --- |
| Text-to-video | Generation | Define the opening composition from text without a source image controlling the first frame. |
| Image-to-video | Image-guided video | Use one or more images as first frame, last frame, identity, product, or visual references. Assign each input a role. |
| Motion control | Motion transfer | A subject image is required. Use either a library `motionId` or a source video, never both. |
| Multi-shot / storyboard | One approved video plan | Divide timing and continuity deliberately. Do not submit one task per shot unless the user explicitly approves separate tasks. |
| Status request | Read-only | Query the existing task; do not call a generation tool. |

For image-to-video, distinguish first frame, last frame, identity or product reference, and style reference. Do not downgrade to text-to-video after an upload, reference-count, or schema error.

Before calling a tool, check mode, reference roles, duration, resolution, shot structure, and protected elements, then present the final settings and obtain explicit confirmation.

## Quality defaults

- Use `1080p` for normal delivery, `4k` for high-quality, commercial, large-screen, or post-production work when supported, and `720p` only for drafts, speed, cost, or modes that support no higher resolution.
- Use 5 seconds for one action or shot; prefer 10 seconds for dialogue, singing, a complete product action, or two connected beats. Use longer durations only when supported and necessary.
- Choose text-to-video aspect ratio by placement: `9:16` for vertical short video, `1:1` for square feeds, and `16:9` for landscape ads, web, or YouTube.
- For image-to-video, derive composition from the source image and omit aspect ratio unless the tool requires it.
- Prefer one continuous shot for one moment. Use multiple shots only when the story changes place, time, scale, or information state, or when requested.
- Keep the first generation focused. Do not add narration, on-screen text, extra characters, or product claims that the user did not request.

## Quality gate

Before submission, check that the action fits the duration, camera instructions do not conflict, first- and last-frame intent is clear, identity or product structure is protected, and multi-shot timing forms a coherent whole.

## Failure handling

- Authorization failure: direct the user to the native OpenClaw MCP connection flow.
- Invalid model or parameter: refresh the live mode definition and change only unsupported fields.
- Insufficient credits: tell the user and stop. Do not retry.
- Lost response: recover or report unknown according to the shared lifecycle; never replay blindly.
- Provider failure: report the message and preserve all IDs; do not resubmit automatically.
