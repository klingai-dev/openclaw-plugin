# Prompt and usage examples

## Suggested prompts

- Draw a red panda in a vintage spacesuit floating by a space station window, with Earth's blue glow lighting its face, richly detailed and cinematic
- Create a 5-second cinematic video: a mecha warrior crashes down from the sky, a shockwave blasts rocks and dust outward, and the camera rapidly pushes in
- Create a 15-second sneaker marketing short: open with a street hook, cut to product close-ups and on-foot action within three seconds, and end on a shoe detail close-up

## Natural-language requests

Text-to-video:

> Use Kling to create a 5-second, 16:9 cinematic video. A vintage motorcycle slowly stops outside a convenience store on a rainy night while the camera smoothly pushes in from a wide shot. Keep the current turn open until the result is displayed.

Image-to-video:

> Turn my attached image into a 5-second video. Preserve the person's identity, facial features, and clothing. Move only the camera, orbiting slowly from the left side to the front, at 720p.

Multi-shot VIDEO 3.0:

> Create a 7-second, four-shot product film: 1.5 seconds for a wide establishing shot, 2 seconds pushing toward the product, 2 seconds orbiting from the side, and 1.5 seconds holding on a brand detail. Enable multi-shot mode and keep the transitions natural.

Text-to-image:

> Create a 16:9 key visual for a poster: a transparent glass teapot in a minimalist white studio, soft side lighting, with open space for a title on the right.

Immediate submission with explicit approval:

> Submit immediately without asking again: create a 5-second, 16:9, 720p single-shot video. A vintage motorcycle slowly stops outside a convenience store on a rainy night.

Status check:

> Check the current status of this Kling generationId once. Do not poll in a loop.

## Prompt construction

Prefer concrete direction in this order:

1. subject and setting
2. action or transformation
3. camera and shot structure
4. lighting and visual style
5. identity or consistency constraints
6. exclusions only when they prevent a likely failure

Avoid long lists of repeated negatives. For image-to-video, state what must remain stable and what is allowed to move.

## User-facing submission summary

Use one compact block:

```text
Ready to submit: image-to-video · VIDEO 3.0 Turbo · 5 seconds · 720p · single shot
Action: keep the subject stable while the camera slowly orbits from the left side to the front
This submission will consume Kling credits.
Reply "Confirm submission" to create one generation task.
```

After acceptance:

```text
The task was submitted once. Follow-up requests will query this generationId and will not create a duplicate task.
You may close this conversation; the task will continue running on Kling's servers.
```
