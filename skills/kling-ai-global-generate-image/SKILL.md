---
name: kling-ai-global-generate-image
description: Use when a user wants Kling AI text-to-image, image-to-image, editing, inpainting, or controlled variations in OpenClaw, including posters, product images, ads, portraits, and social media visuals. Existing task status and result requests follow the shared task lifecycle.
---

# Kling AI Image Generation

Turn a creative request into one well-specified Kling AI image request. Use only the live tools and mode definitions exposed by the MCP service configured at `https://kling.ai/mcp`.

## Operating rules

- Use host-managed OAuth. Never request or expose API keys, tokens, cookies, authorization headers, or signed URLs.
- Resolve required inputs and validate live parameters, then show the final mode, model, dimensions, aspect ratio, and output count. Explain that submission consumes Kling AI credits. Call a generation tool only after the user explicitly confirms; the initial request is not the final confirmation.
- Submit each approved attempt once. Never retry a failed or ambiguous submission automatically.
- Discover live modes before choosing a tool, model, input name, or enum. Live provider fields override examples in this file.
- Upload attached reference media with the remote upload tool when required, and reuse the returned provider reference exactly.

Before submitting, retrying, or querying, read the [shared task lifecycle](../kling-ai-global-plugin/references/tool-workflows.md). Read the [MCP contract](../kling-ai-global-plugin/references/mcp-contract.md) when field details are needed, and let the current `tools/list` and `who_am_i` override dynamic values in the snapshot.

## Workflow

1. Classify the request with the mode table below.
2. For products, ads, thumbnails, portraits, edits, or concept work, read [scene patterns](references/scene-patterns.md).
3. For vague requests, reference images, exact copy, or controlled variations, read [prompt construction](references/prompt-construction.md).
4. Ask only for missing information that materially changes the result: subject or product, placement, aspect ratio, required copy, or reference identity that must remain consistent.
5. Among live models that support the required mode and references, prefer full-quality models. Use low-cost or fast models only when the user explicitly prioritizes drafts, speed, or credit savings.
6. Build one prompt that specifies subject, action, environment, composition, lighting, color, material detail, camera language, and exclusions. Convert abstract terms such as “premium” or “cinematic” into visible choices.
7. Follow the shared lifecycle: reuse `taskTraceId` for one goal and call the image generator at most once per confirmed attempt.

## Modes

| User intent | Mode | Interpretation |
| --- | --- | --- |
| Text-to-image | New image | Build the scene from text without a source image controlling identity or composition. |
| Image-to-image | Edit or reference-guided image | Use at least one image to control content, identity, product structure, composition, or style. Assign each input a role. |
| Element as subject | Image-to-image | Read the Element first and use only a live image-to-image model that explicitly supports `elements`. |
| Variation / restyle | Focused image-to-image | Lock every unspecified fact from the source and name the one dimension allowed to change. |
| Status request | Read-only | Query the existing task; do not call a generation tool. |

Do not switch modes silently. An attached image does not automatically require image-to-image. Conversely, never downgrade an explicit image-to-image request to text-to-image after an upload or schema error.

Before calling a tool, check the selected mode, aspect ratio, reference roles, and allowed changes, then present the final settings and obtain explicit confirmation.

## Quality defaults

- Use `2k` for normal delivery, `4k` for high-quality, commercial, advertising, fine-material, or crop-heavy work when supported, and `1k` only for drafts or speed-first requests.
- When a live `quality` parameter exists, use medium for normal delivery, high for commercial work, and low only for drafts.
- Choose aspect ratio by placement: `1:1` for square social or product images, `4:5` for feed portraits, `9:16` for stories or vertical covers, and `16:9` for banners or thumbnails.
- Generate one image unless the user asks for more.
- Prefer a clean image without text unless the user explicitly requests generated text.
- Change one clear dimension per approved variation.
- Lock user-provided names, labels, logos, faces, and product structure. Never invent claims, prices, certifications, ingredients, effects, or statistics.

## Quality gate

Before submission, check for one clear focal subject, readable hierarchy, a safe area appropriate to placement, coherent lighting, and non-conflicting camera or composition instructions. If the host can inspect the output, verify reference fidelity, text accuracy, subject count, and obvious defects. Otherwise, do not claim visual QA was completed.

## Failure handling

- Authorization failure: direct the user to the native OpenClaw MCP connection flow.
- Unsupported parameter: refresh the live mode definition and change only rejected fields.
- Insufficient credits: tell the user and stop. Do not retry.
- Lost response: recover or report unknown according to the shared lifecycle; never replay blindly.
- Provider failure: report the provider message and preserve all IDs; do not resubmit automatically.
