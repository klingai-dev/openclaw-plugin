# Image prompt construction

## Prompt order

Write prompts in this order:

1. Placement and medium: product photo, editorial portrait, poster, thumbnail, or marketing still.
2. Subject and locked facts: identity, product structure, exact colors, official logo, or copy.
3. Action or visual idea.
4. Environment, time, weather, and mood.
5. Composition: aspect ratio, framing, camera height, lens feel, focal hierarchy, and negative space.
6. Lighting and color.
7. Materials, texture, surface detail, and realism or stylization.
8. Constraints: subject count, locked elements, no extra text or watermark, and safe-area requirements.

## Reference inventory

Assign a role to each input before writing the creative prompt:

```text
Reference 1 = primary subject identity
Reference 2 = product structure and label
Reference 3 = official logo; preserve exact shape and color
```

Do not treat a style reference as an identity reference. State which visual traits may transfer.

## Exact text

- Preserve user-provided copy verbatim.
- If a deterministic design tool can add text later, prefer generating a text-free base image with intentional copy space.
- If the user requires text in the generated image, include the exact copy once, prohibit other readable text, and note that generated typography may need review.

## Controlled variations

Write separate prompts rather than requesting a batch of near-duplicates. Keep locked facts identical and change one dimension at a time:

- Concept: direct display / lifestyle scene / visual metaphor
- Camera: macro / medium / environmental wide
- Composition: centered / rule-of-thirds / top-down
- Mood: bright commercial / restrained premium / high-saturation energetic
- Expression or action

## Avoid

- Empty praise without visual evidence, such as “beautiful.”
- Conflicting directions, such as minimal and densely layered, or macro and full environmental wide.
- Long negative lists that repeat positive requirements.
- Unverified product claims, medical effects, prices, awards, certifications, or statistics.
- Assuming a model or parameter exists before checking the live mode definition.
