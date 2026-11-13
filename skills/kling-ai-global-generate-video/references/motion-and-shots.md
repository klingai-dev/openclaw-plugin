# Motion and shot planning

## Decide whether edits are needed

- Preserve the prompt verbatim when the user asks to use it as is. For a supplied prompt, review only what affects the intended result: subject, action, camera, timing, continuity, and constraints. Details left to the model may stay unspecified.
- If the supplied prompt is clear, consistent, and sufficient, deliver or submit it verbatim. Apply the same judgment to a general request to optimize it.
- Resolve material omissions, ambiguities, or conflicts from the request and its references first. Clarify before submitting if essential intent is still unclear.
- Change only the wording needed to make the requested edit or address the gap. Preserve the rest verbatim. Append ready-to-use wording as supplied. When adding only an ending, keep the requested action, timing, and final position; leave unspecified intervening motion to the model. Adjust only the necessary references if the generation tool requires specific asset syntax.

## Motion-first prompt order

Use the relevant items below when drafting or adding to a prompt. Put action and continuity first. Express abstract quality requests through visible choices in lighting, materials, depth of field, or composition.

1. Format and duration.
2. Opening frame and subject position.
3. Main subject action with beginning, development, and finish.
4. Camera movement and speed.
5. Environmental movement and physical effects.
6. Lighting, color, lens feel, and time of day.
7. Continuity locks: identity, clothing, product structure, logo, architecture, and screen direction.
8. Constraints: subject count, elements that must keep their shape, and text or watermark restrictions.

When describing transitions between supplied keyframes, connect them in order and settle on the last frame without overshooting or snapping back unless requested.

## Camera vocabulary

- `locked-off`: observation, product detail, graphic composition
- `slow push-in`: emphasis, intimacy, detail reveal
- `pull-back reveal`: expand environment or scale
- `lateral tracking`: follow motion while preserving side relationship and orientation
- `orbit`: show a product or character in three dimensions; keep speed restrained
- `crane rise/drop`: establish or resolve spatial scale
- `handheld follow`: urgency or UGC realism; specify restrained or energetic
- `whip pan`: transition or impact; use sparingly and name the landing subject

Do not stack several camera-movement verbs into one five-second shot.

For continuous hand-object action, frame the whole action path so the hands and object stay visible through the final handoff or placement.

## Short-duration fit

- 5 seconds: one action and one camera move.
- 10 seconds: one action with setup and result, or two connected beats.
- 15 seconds: a compact three-beat sequence when supported; otherwise one fully developed continuous shot.

These are planning guidelines, not provider capabilities. Use only durations accepted by the live mode.

## Multi-shot template

```text
Shot 1 — <duration>: <framing>; <single narrative job>; <subject action>; <camera move>.
Continuity: <identity/product/location anchors>.

Shot 2 — <duration>: <framing>; <new narrative job>; <subject action>; <camera move>.
Continuity: preserve <anchors>; transition through <match/action/screen direction>.
```

Total timing must be consistent. Every shot should add information rather than repeat a prettier angle.

Across a cut in continuous hand-object action, match grip, object position, and support contact on both sides of the cut. Use a brief stable beat only if the pacing calls for it. Continue the action without replaying steps or adding a long pause.

## Reference handling

- First frame: preserve composition and animate from it.
- Multiple references: label each role; do not treat every image as an interchangeable style input.
- Character continuity: lock face, apparent age, hair, clothing, proportions, and distinguishing features.
- Product continuity: lock dimensions, materials, label text, logo position, and moving parts.

## Motion-control media

- The subject image should clearly show the person or animal and roughly match the body coverage of the motion source.
- Use one continuous motion-source shot without cuts, occlusion, excessive speed, or competing subjects.
- Current product guidance recommends 3–30 seconds, at least 340 px on the short side, and no more than 3850 px on the long side. Follow stricter live MCP limits.
- `motion_control` requires a subject `image` and exactly one of library `motionId` or source `video`. Use field names and values from the current `who_am_i` model definition.

## Ads and explainers

Give each beat one communication job: hook, context, evidence, or resolution. Never invent performance claims, testimonials, statistics, prices, awards, certifications, or regulatory statements.

## Submission check

Check duration, resolution, aspect ratio, shot structure, and protected elements. Then follow the [shared approval and submission rules](../../kling-ai/references/tool-workflows.md).
