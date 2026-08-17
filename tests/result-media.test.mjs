import assert from "node:assert/strict";
import test from "node:test";

import { normalizeKlingResultMedia } from "../dist/result-media.mjs";

test("moves Kling Markdown images into native OpenClaw media", () => {
  const url = "https://p4-fdl.klingai.com/bs2/upload-ylab-stunt/opaque-result-id?x=1";
  const payload = normalizeKlingResultMedia({
    text: `Generation complete\n\n![Samoyed portrait](${url})\n\nGeneration ID: abc`
  });

  assert.equal(payload.text, "Generation complete\n\nGeneration ID: abc");
  assert.deepEqual(payload.mediaUrls, [url]);
  assert.deepEqual(payload.attachments, [{
    type: "image",
    url,
    name: "Samoyed portrait"
  }]);
});

test("preserves non-Kling Markdown images", () => {
  const input = { text: "![example](https://example.com/image.png)" };
  assert.equal(normalizeKlingResultMedia(input), input);
});

test("merges native media without duplicates", () => {
  const url = "https://klingai.com/result-without-extension";
  const payload = normalizeKlingResultMedia({
    text: `![result](${url})`,
    mediaUrls: [url]
  });

  assert.deepEqual(payload.mediaUrls, [url]);
  assert.deepEqual(payload.attachments, [{
    type: "image",
    url,
    name: "result"
  }]);
});

test("preserves existing MIME and dimensions for opaque image URLs", () => {
  const url = "https://p4-fdl.klingai.com/bs2/upload-ylab-stunt/opaque-result-id";
  const payload = normalizeKlingResultMedia({
    text: `![Generated image](${url})`,
    mediaUrls: [url],
    attachments: [{
      url,
      mimeType: "image/jpeg",
      name: "existing-name.jpg",
      width: 1920,
      height: 1080
    }]
  });

  assert.deepEqual(payload.attachments, [{
    url,
    mimeType: "image/jpeg",
    name: "existing-name.jpg",
    width: 1920,
    height: 1080,
    type: "image"
  }]);
});

test("uses a stable image name when Markdown alt text is empty", () => {
  const url = "https://klingai.com/opaque-result";
  const payload = normalizeKlingResultMedia({ text: `![](${url})` });

  assert.equal(payload.attachments[0].name, "Kling generated image 1");
});
