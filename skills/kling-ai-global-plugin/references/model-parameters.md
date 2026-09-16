# MCP model parameter snapshot

Call `who_am_i` again before every submission. If models, defaults, enums, required fields, or inputs have changed, use the live values. The top-level `model` must be the canonical model name returned for the target tool. Every `arguments[].value` is a string, including booleans and JSON arrays.

## Input-name index

- Multi-image references: `image_1` through `image_10`
- First and last frames: `first_image`, `tail_image`
- 2.1 references: `subject_image_0` through `subject_image_3`, `scene_image`, `style_image`
- Motion control: `image`, `video`

Pass an input only when the selected model's current `inputs` array declares that name.

## `text_to_image`

- `kling-image-v3_0_omni`
  - Arguments: required `prompt`; `img_resolution=4k` (`1k/2k/4k`); `aspect_ratio=3:4` (`auto/9:16/2:3/3:4/1:1/4:3/3:2/16:9/21:9`); `imageCount=1` (`1–9`); up to 10 `elements`.
  - Inputs: none.
- `kling-image-o1`
  - Arguments: required `prompt`; `img_resolution=2k` (`1k/2k`); `aspect_ratio=3:4` (`9:16/2:3/3:4/1:1/4:3/3:2/16:9/21:9`); `imageCount=1` (`1–9`); up to 10 `elements`.
  - Inputs: none.
- `kling-image-v3_0`
  - Arguments: required `prompt`; `img_resolution=2k` (`1k/2k`); same ratios as O1; `imageCount=1` (`1–9`); up to 10 `elements`.
  - Inputs: none.
- `kling-image-v2_1`
  - Arguments: required `prompt`; `img_resolution=2k` (`1k/2k`); `aspect_ratio=3:4` with the same non-auto ratios; `imageCount=1` (`1–9`).
  - Inputs: none.

The tool-level contract currently prohibits Elements for `text_to_image`. Do not pass `elements` or use `<<<id>>>`, even if a model snapshot lists the field.

## `image_to_image`

- `kling-image-v3_0_omni`
  - Arguments: required `prompt`; `img_resolution=4k` (`1k/2k/4k`); ratio includes `auto`; `imageCount=1` (`-1` or `1–9`); `story_mode=false`; up to 10 `elements`.
  - Inputs: required `image_1`; optional `image_2` through `image_10`.
- `kling-image-o1`
  - Arguments: required `prompt`; `img_resolution=2k` (`1k/2k`); ratio includes `auto`; `imageCount=1` (`1–9`); up to 10 `elements`.
  - Inputs: required `image_1`; optional `image_2` through `image_10`.
- `kling-image-v3_0`
  - Arguments: required `prompt`; `img_resolution=1k` (`1k/2k`); ratio includes `auto`; `imageCount=1` (`1–9`); up to 10 `elements`.
  - Inputs: required `image_1`; optional `image_2` through `image_10`.
- `kling-image-v2_1`
  - Arguments: optional `prompt`; `aspect_ratio=1:1` (`9:16/2:3/3:4/1:1/4:3/3:2/16:9/21:9`); `imageCount=1` (`1–9`).
  - Inputs: optional `subject_image_0` through `subject_image_3`, `scene_image`, and `style_image`.
  - The model description requires a matching `raw_subject_image_N` URL for each subject and at least two distinct images across subject, scene, and style, but the current input schema does not declare raw fields. Do not guess until the schema conflict is fixed.

For 3.0 Omni, O1, and 3.0, the current input descriptions require URLs returned by `file_upload`; do not use local paths or arbitrary external URLs.

## `text_to_video`

- `kling-video-v2_5`: required `prompt`; `duration=5` (`5/10`); `aspect_ratio=16:9` (`16:9/9:16/1:1`); `imageCount=1` (`1–4`); `resolution=1080p` (`720p/1080p`); `enable_audio=true`; `enable_asmr=false`; optional `audio_prompt`, `music_prompt`; no inputs.
- `kling-video-o1`: required `prompt`; `duration=5` (`3–10`); `aspect_ratio=16:9`; `resolution=1080p`; `imageCount=1` (`1–4`); up to 7 `elements`; no inputs.
- `kling-video-v3_0_omni`: required `prompt`; `duration=5` (`3–15`); `aspect_ratio=16:9`; `resolution=4k` (`720p/1080p/4k`); `imageCount=1` (`1–4`); `prefer_multi_shots=false`; `enable_audio=false`; up to 7 `elements`; no inputs.
- `kling-video-v3_0`: same core arguments as 3.0 Omni; up to 3 `elements`; no inputs.
- `kling-video-v3_0_turbo`: required `prompt`; `duration=5` (`3–15`); `resolution=1080p` (`720p/1080p`); `imageCount=1` (`1–4`); `aspect_ratio=16:9`; no inputs.

The tool-level contract currently prohibits Elements for `text_to_video`. Do not pass `elements` or `<<<id>>>`.

## `image_to_video`

- `kling-video-v3_0_omni`
  - Arguments: required `prompt`; `duration=5` (`3–15`); `aspect_ratio=16:9`; `resolution=4k` (`720p/1080p/4k`); `imageCount=1` (`1–4`); `prefer_multi_shots=false`; `enable_audio=false`; up to 7 `elements`.
  - Inputs: required `image_1`; optional `image_2` through `image_7`.
- `kling-video-v3_0`
  - Arguments: optional `prompt`; `duration=5` (`3–15`); `resolution=4k`; `imageCount=1` (`1–4`); `prefer_multi_shots=true`; `enable_audio=false`; up to 3 `elements`.
  - Inputs: required `first_image`; optional `tail_image`.
- `kling-video-v3_0_turbo`
  - Arguments: optional `prompt`; `duration=5` (`3–15`); `resolution=1080p` (`720p/1080p`); `imageCount=1` (`1–4`).
  - Inputs: required `first_image`.

Current frame inputs for 3.0 and Turbo require URLs returned by `file_upload`.

## `motion_control`

- `kling-video-v2_6`
  - Arguments: optional `prompt`; optional `motionId`; required `motionDirection` (`image_direction/motion_direction`); `resolution=720p` (`720p/1080p`); `keepOriginalSound=true` (`true/false`).
  - Inputs: required `image`; optional `video`.
- `kling-video-v3_0`
  - Same arguments as 2.6, plus up to one `element`.
  - Inputs: required `image`; optional `video`.

Provide exactly one of `motionId` or `video`. `image_direction` supports only 3–10 seconds; `motion_direction` follows the source video's direction.
