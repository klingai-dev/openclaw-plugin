# Image prompt construction

## Decide whether edits are needed

- Preserve the prompt verbatim when the user asks to use it as is. For a supplied prompt, review only what affects the intended result: subject and locked facts, scene, composition, lighting and color, style, and constraints. Details left to the model may stay unspecified.
- If the supplied prompt is clear, consistent, and sufficient, deliver or submit it verbatim. Apply the same judgment to a general request to optimize it.
- Resolve material omissions, ambiguities, or conflicts from the request and its references first. Clarify before submitting if essential intent is still unclear.
- Change only the wording needed to make the requested edit or address the gap. Preserve the rest verbatim. If the user clarifies one ambiguity, replace only that passage; if one sentence suffices, append it to the original. Adjust only the necessary references if the generation tool requires specific asset syntax.

## Prompt order

Use the relevant items below when drafting or adding to a prompt. Prioritize concrete facts, exact copy, and protected elements over mood.

1. Placement and medium: product photo, editorial portrait, poster, thumbnail, or marketing still.
2. Subject and locked facts: identity, product structure, exact colors, official logo, or copy.
3. Action or visual idea.
4. Environment, time, weather, and mood.
5. Composition: aspect ratio, framing, camera height, lens feel, focal hierarchy, and negative space.
6. Lighting and color.
7. Materials, texture, surface detail, and realism or stylization.
8. Constraints: subject count, locked elements, text or watermark restrictions, and safe-area requirements.

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
- If the user agrees to add type later and a design tool is available, generate a text-free base image with intentional copy space.
- If the user wants text in the generated image, include the exact copy and any requested placement, hierarchy, or language. For a single added title, preserve existing labels and leave unspecified fonts, colors, and margins to the model. Restrict other text only when the user asks. Check the output for text accuracy and legibility.

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
