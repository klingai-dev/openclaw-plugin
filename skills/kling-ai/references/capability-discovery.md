# Account-scoped capability discovery

Read this before choosing a model for generation or a model recommendation. Status, credit, and library queries do not need model discovery.

## Discover candidates

1. Read the current connection's complete `tools/list`, following all pagination. Only discovered tools are candidates. A failed discovery is not an empty list and must not trigger a fallback to old capabilities.
2. If the live `who_am_i` schema declares `tools`, pass a nonempty set of relevant generation tools; otherwise read the full response. Do not invent model or field filters. For V4 discovery, include all discovered generation tools that support the requested output type and intent.
3. Treat `who_am_i.availableModels` and each tool's `models` as the authority for this account. Match requested canonical names or declared aliases within that set. A tool's existence, examples, membership tier, or `defaultModel` alone does not establish model access; the default must also belong to its model set.
4. If a requested model is missing from the filtered response, check the remaining discovered generation tools before concluding it was not returned. A model available only for another output type is not a candidate for this request. Explain that mismatch without claiming an account permission failure or changing the requested media type.
5. Fix one tool/model pair, then read [model parameters](model-parameters.md). Never move a model or its arguments to a different tool.

## Video candidates

For text-driven video, query `text_to_video`; for image-driven video or keyframes, query `image_to_video`. When `omni_ref_video` exists, include it in the same capability query in both cases. For example, a pure-text request queries `["text_to_video", "omni_ref_video"]` when both exist and the filter is supported. Do not exclude omni reference because there are no attachments: the selected model's required inputs determine whether text-only generation is valid.

Host tool-name search must discover these candidates, not just the legacy entry point. Search results for `text_to_video` alone are not a complete tool inventory. Motion transfer must retain its subject-image and motion-source requirements. See [video model routing](../../kling-ai-global-generate-video/references/model-routing.md) before choosing a video model.

## Selection and visibility

- A user-specified available model takes precedence if it meets the requirements. If the user leaves the model open, prefer a compatible Kling 4.0 model for normal delivery, prioritizing `omni_ref_video` where compatible. Prefer a compatible Kling 4.0 Flash model for drafts, speed, or credit savings. Match the two variants by live canonical names or declared aliases.
- If no compatible V4 video model is returned, retain the existing compatible entry point and its available `defaultModel` for ordinary video requests, and explain why V4 cannot be selected. Do not silently switch models when the user explicitly requests a particular model.
- When no image model is specified, prefer Kling Image 4.0 (`kling-image-v4_0`) if it is available and compatible in the image tool for the requested mode, even if the tool returns a different `defaultModel`. If 4.0 is unavailable or incompatible, prefer the tool's compatible `defaultModel`, then another compatible model. If the user requests a specific model or the MCP tool's own default, validate that choice and explain any limitation.
- Use the full name of the selected model in recommendations and recommend only models returned for the current account.
- Required references, duration, sound, speed, and budget take precedence over version preferences. Do not silently drop requirements, increase output count, or lower specifications to make a model fit.
- Reuse one successful discovery response during the same generation preparation. Refresh after reconnecting, switching account/endpoint, changed entitlements, a capability notification, or a rejected model/argument; query additional tools when the candidate set changes.
- A filtered response says nothing about unqueried tools. If full discovery still does not return a requested model, report only that the current connection did not return it. If the user says it is enabled, follow [capability troubleshooting](troubleshooting.md#model-capability-mismatch); do not guess a model identifier or probe access by generating.
- Model capability comes from `who_am_i`; request encoding comes from the tool's `inputSchema`. Tool examples cannot expand model capabilities. Refresh inconsistent or incomplete definitions; if no valid request satisfies both, stop before submission.
