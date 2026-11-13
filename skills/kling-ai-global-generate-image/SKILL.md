---
name: kling-ai-global-generate-image
description: Write or refine Kling AI image prompts, or prepare, generate, and edit images in OpenClaw. Use for text-to-image, image-to-image, inpainting, posters, product images, ads, portraits, and controlled variations.
---

# Kling AI Image Generation

Use only the live tools and mode definitions exposed by the MCP service configured at `https://kling.ai/mcp/plugin`.

For prompt-only requests, use [prompt construction](references/prompt-construction.md) to decide whether edits are needed. Read [scene patterns](references/scene-patterns.md) if scene decisions remain. Preserve composition requirements such as left-side copy space. Finish after delivering the prompt. Skip account discovery, uploads, and offers to generate. Include model, ratio, resolution, or count recommendations only if requested.

When preparing to generate, on first use or missing UI, follow the [shared MCP Apps setup check](../kling-ai/SKILL.md#mcp-apps-setup-check) before continuing.

## Live V4 capabilities

Before selecting any generation model, follow [capability discovery](../kling-ai/references/capability-discovery.md) and [model parameters](../kling-ai/references/model-parameters.md). For Elements, motion library, or uploads, follow [asset workflows](../kling-ai/references/asset-workflows.md). These live rules supersede static model examples.

Element use follows the selected model's declared resource types and binding arguments, including live text-to-image support. Call `element_get` before reuse; keep required image inputs. Video V4 support does not imply a V4 image model.

## Operating rules

- Use host-managed OAuth. Never request or expose API keys, tokens, cookies, authorization headers, or signed URLs.
- Follow the [shared task lifecycle](../kling-ai/references/tool-workflows.md) for final settings, credit disclosure, and explicit authorization.
- Before calling `text_to_image` or `image_to_image`, check the current balance with `query_membership_and_credits` on the same connection. Pause if the balance is unavailable, non-positive, or explicitly insufficient. Never use generation to probe the balance.
- Submit each approved attempt once. Never retry a failed or ambiguous submission automatically.
- Discover live modes before choosing a tool, model, input name, or enum. Live provider fields override examples in this file.
- Upload attached reference media with the remote upload tool when required, and reuse the returned provider reference exactly.

Before submitting, retrying, or querying, read the [shared task lifecycle](../kling-ai/references/tool-workflows.md). Read the [MCP contract](../kling-ai/references/mcp-contract.md) when field details are needed, and let the current `tools/list` and `who_am_i` override dynamic values in the snapshot.

## Workflow

When resuming after a top-up, follow the [resume workflow](../kling-ai/references/tool-workflows.md#resume-after-insufficient-credits) for any existing task before preparing a new submission.

1. Classify the request with the mode table below.
2. For each new generation, edit, or variation, read [prompt construction](references/prompt-construction.md) to review an existing prompt or guide a new one. Status checks and authorized retries with unchanged parameters do not require a prompt review.
3. For products, ads, thumbnails, portraits, edits, or concept work, read [scene patterns](references/scene-patterns.md) if scene decisions remain.
4. Ask only for missing information that materially changes the result: subject or product, placement, aspect ratio, required copy, or reference identity that must remain consistent.
5. Among live models that support the required mode and references, prefer full-quality models. Use low-cost or fast models only when the user explicitly prioritizes drafts, speed, or credit savings.
6. Reuse a suitable prompt verbatim. Make targeted edits or write a new prompt as needed. When translating abstract terms such as “premium” or “cinematic,” express them through visible choices in lighting, materials, depth of field, color, or composition.
7. Check the actual request for the top-level `model`, required arguments, and reference slots. Bind the complete media URL to `image_1` when the model requires it. Use uppercase `URL` when the tool schema declares that literal for `inputType`.
8. Reuse any still-valid original upload references and follow the shared lifecycle for authorization, the credit check, and one submission.

## Modes

| User intent | Mode | Interpretation |
| --- | --- | --- |
| Text-to-image | New image | Build the scene from text without a source image controlling identity or composition. |
| Image-to-image | Edit or reference-guided image | Use at least one image to control content, identity, product structure, composition, or style. Assign each input a role. |
| Element as subject | Live-supported image generation | Read the Element first; use only a model declaring its resource type and binding argument. |
| Variation / restyle | Focused image-to-image | Lock every unspecified fact from the source and name the one dimension allowed to change. |
| Status request | Read-only | Query the existing task; do not call a generation tool. |

Do not switch modes silently. An attached image does not automatically require image-to-image. Conversely, never downgrade an explicit image-to-image request to text-to-image after an upload or schema error.

Before calling a tool, check the selected mode, aspect ratio, reference roles, and allowed changes, then follow the shared lifecycle’s approval rules.

## Quality defaults

- Use `2k` for normal delivery, `4k` for high-quality, commercial, advertising, fine-material, or crop-heavy work when supported, and `1k` only for drafts or speed-first requests.
- When a live `quality` parameter exists, use medium for normal delivery, high for commercial work, and low only for drafts.
- Choose aspect ratio by placement: `1:1` for square social or product images, `4:5` for feed portraits, `9:16` for stories or vertical covers, and `16:9` for banners or thumbnails.
- Generate one image unless the user asks for more.
- Prefer a clean image without text unless the user explicitly requests generated text.
- Change one clear dimension per approved variation.
- Lock user-provided names, labels, logos, faces, and product structure. Never invent claims, prices, certifications, ingredients, effects, or statistics.

## Quality gate

Before submission, check what matters for the intended use: focal subject, visual hierarchy, safe area for placement, lighting, and any conflicting camera or composition instructions. If the host can inspect the output, verify reference fidelity, text accuracy, subject count, and obvious defects. Otherwise, do not claim visual QA was completed.

## Failure handling

- Authorization failure: direct the user to the native OpenClaw MCP connection flow.
- Invalid parameters or media: refresh the live definitions and keep the original prompt, mode, and reference roles. Correct only rejected fields or supply missing inputs. For an invalid resource, use [media reference recovery](../kling-ai/references/troubleshooting.md#upload-or-media-reference-failure) to distinguish this image-to-image task from the source-image task.
- Insufficient credits: follow the [resume workflow](../kling-ai/references/tool-workflows.md#resume-after-insufficient-credits). Keep the prompt, settings, and reference roles until the user explicitly asks to continue.
- Lost response: recover or report unknown according to the shared lifecycle; never replay blindly.
- Provider failure: report the provider message and preserve all IDs; do not resubmit automatically.
