# Kling AI prompt and usage examples

## Prompt ideas

- Use Kling to generate a series of three images in one request. Show the same red panda in a vintage spacesuit exiting a space station, drifting past a porthole, and turning to look at the blue Earth.
- Use Kling 4.0 to generate a 20‑second cinematic video: a mech warrior slams down from height onto the ground, sending out a shockwave that instantly blasts apart rubble and dust, with the camera rapidly pushing in for a powerful impact.
- Use Kling 4.0 Flash to turn my sneaker product photo into a 20-second, 720p video. Start from the photo, slowly orbit the shoe, and end on a close-up of the upper.
- Use Kling AI to browse the motion library and preview saved motions; after I select one, apply it to my subject image with an available motion-control model to generate a video.
- Use Kling AI to save the front and side views of my character as my first reusable Element, named “Xiaobai”, to help keep the character consistent in later creations.

## Natural-language requests

Text-to-video:

> Create a five-second, 16:9 cinematic video with Kling AI: a vintage motorcycle stops outside a convenience store on a rainy night as the camera slowly pushes in.

Image-to-video:

> Use my attached image for a five-second image-to-video shot. Keep the person's identity, face, and clothing unchanged. Orbit slowly from the left to the front at 720p.

Multi-shot video:

> Create a multi-shot product film: establish the scene wide, move closer to show the product from the side, and end on the brand detail. Use currently supported duration and shot parameters.

Text-to-image:

> Create a 16:9 poster visual with Kling AI: a transparent glass teapot in a minimal white studio with soft side lighting and title space on the right.

Status query:

> Check this Kling AI task once. Do not poll and do not submit another task.

## Prompt structure

Prefer concrete directions in this order:

1. Subject and environment
2. Action or change
3. Camera and shot structure
4. Lighting and visual style
5. Identity or continuity constraints
6. Exclusions only when they prevent a likely failure

Avoid repetitive negative lists. For image-to-video, state what must remain stable and what may move.

## User-facing submission

Before submission, follow the [shared approval rules](tool-workflows.md). After submission, keep the response concise:

```text
I will return the primary result when complete. Result links may be temporary signed URLs.
If a link expires, query the same task ID again or view the generation in your authorized Kling AI account.
```
