# Video entry points and model selection

First follow [capability discovery](../../kling-ai/references/capability-discovery.md). A discovered tool is not proof that any particular model is enabled. Never route by tool count, a static model name, or an earlier account's capabilities.

| Complete live discovery | Routing |
| --- | --- |
| No `omni_ref_video` | Use `text_to_video`, `image_to_video`, or `motion_control` according to intent and available model capabilities. A new model returned on these tools remains eligible. |
| `omni_ref_video` exists | Query its models together with relevant existing video tools, even for pure-text requests. Prefer a compatible V4 model returned by the account, subject to the user's model and capability requirements. |
| No compatible V4 model is returned | Select a compatible live default if the user allows other models. If V4 is required, report that no eligible pair was returned and stop. |
| Discovery failed or the requested model/capability is unavailable | Resolve the discovery failure or explain the current limitation. Do not silently use an older model, remove references, or generate to test availability. |

When the user leaves the model open, recommend compatible Kling 4.0 Omni-Ref for normal delivery and compatible Kling 4.0 Flash for speed or credit savings. Keep the requested resolution and output count, and use live billing information for budget choices.

## Intent and inputs

- Match an explicit request for Kling 4.0 (V4) or Kling 4.0 Flash (V4 Flash) to the full model name returned for the account. Standard Kling 4.0 supports first, last, and intermediate keyframes in image-to-video, and images, videos, audio, and Elements in Omni-Ref. Flash uses a single first frame in image-to-video, and supports images, videos, and Elements in Omni-Ref. A separate audio reference requires a declared audio input. Synchronized sound and source-video audio preservation use output controls.
- Text-only video can use `omni_ref_video` only if the chosen model explicitly permits no media inputs; otherwise use a compatible `text_to_video` model. The word "reference" in the tool name does not make attachments mandatory.
- Image, video, Element, and audio references can use `omni_ref_video` only when the selected model supports each requested type and their combination. Do not treat its general tool description as every model's capability list.
- Keyframes belong to whichever discovered tool/model declares the needed frame inputs. Do not hardcode them to one entry point, invent intermediate frames, or substitute identity references for frame control.
- Motion transfer must use a model that explicitly supports that intent and all required inputs. Existing `motion_control` requests keep the subject image and exactly one motion source.
- Do not move an omni model to `image_to_video` or `text_to_video`; tool/model pairs and their parameter sets are inseparable.

- For required silence, keep only pairs with a declared sound-off setting or an explicit silent-output guarantee. Missing audio fields, the text-to-video tool name, and a silent prompt supply no guarantee. Compatible text-only omni remains eligible. Keep the user’s model restriction while filtering.

After selection, apply [model parameters](../../kling-ai/references/model-parameters.md), including conditional reference caps, Elements, and audio exclusivity. One multi-shot plan remains one task unless separate tasks were explicitly approved. The core Skill's billing, single-submission, and result rules apply to omni reference too.
