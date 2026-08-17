import assert from "node:assert/strict";
import test from "node:test";

import { normalizeKlingResultMedia } from "./result-media.mjs";

test("moves Kling Markdown images into native OpenClaw media", () => {
  const payload = normalizeKlingResultMedia({
    text: "Generation complete\n\n![Samoyed](https://p4-fdl.klingai.com/image.png?x=1)\n\nGeneration ID: abc"
  });

  assert.equal(payload.text, "Generation complete\n\nGeneration ID: abc");
  assert.deepEqual(payload.mediaUrls, ["https://p4-fdl.klingai.com/image.png?x=1"]);
});

test("preserves non-Kling Markdown images", () => {
  const input = { text: "![example](https://example.com/image.png)" };
  assert.equal(normalizeKlingResultMedia(input), input);
});

test("merges native media without duplicates", () => {
  const url = "https://klingai.com/result.png";
  const payload = normalizeKlingResultMedia({
    text: `![result](${url})`,
    mediaUrls: [url]
  });

  assert.deepEqual(payload.mediaUrls, [url]);
});
