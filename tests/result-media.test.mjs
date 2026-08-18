import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeKlingResultMedia,
  normalizeKlingResultMediaForDelivery
} from "../dist/result-media.mjs";

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
    mimeType: "image/jpeg",
    name: "Samoyed portrait.jpg"
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
    mimeType: "image/jpeg",
    name: "result.jpg"
  }]);
});

test("adds image metadata to OpenClaw native MEDIA URLs", () => {
  const url = "https://s15-kling.klingai.com/kimg/opaque-result.png.origin?x-kcdn-pid=112372";
  const payload = normalizeKlingResultMedia({
    text: "Generation complete",
    mediaUrls: [url]
  });

  assert.equal(payload.text, "Generation complete");
  assert.deepEqual(payload.mediaUrls, [url]);
  assert.deepEqual(payload.attachments, [{
    type: "image",
    url,
    mimeType: "image/png",
    name: "Kling generated image 1.png"
  }]);
});

test("extracts Kling MEDIA directives before OpenClaw creates native media", () => {
  const url = "https://s15-kling.klingai.com/kimg/opaque-result.png.origin?x-kcdn-pid=112372";
  const payload = normalizeKlingResultMedia({
    text: `Generation complete\n\nMEDIA:${url}\n\nSave it soon.`
  });

  assert.equal(payload.text, "Generation complete\n\nSave it soon.");
  assert.deepEqual(payload.mediaUrls, [url]);
  assert.deepEqual(payload.attachments, [{
    type: "image",
    url,
    mimeType: "image/png",
    name: "Kling generated image 1.png"
  }]);
});

test("recognizes opaque image URLs from the international Kling domain", () => {
  const url = "https://cdn.kling.ai/generated/opaque-result-id";
  const payload = normalizeKlingResultMedia({ text: `![International result](${url})` });

  assert.deepEqual(payload.attachments, [{
    type: "image",
    url,
    mimeType: "image/jpeg",
    name: "International result.jpg"
  }]);
});

test("infers image MIME and filename from a URL extension when available", () => {
  const url = "https://p4-fdl.klingai.com/generated/result.webp";
  const payload = normalizeKlingResultMedia({ text: `![Generated image](${url})` });

  assert.equal(payload.attachments[0].mimeType, "image/webp");
  assert.equal(payload.attachments[0].name, "Generated image.webp");
});

test("infers PNG metadata from Kling's .png.origin paths", () => {
  const url = "https://p4-fdl.klingai.com/generated/opaque-result.png.origin";
  const payload = normalizeKlingResultMedia({ text: `![Generated image](${url})` });

  assert.equal(payload.attachments[0].mimeType, "image/png");
  assert.equal(payload.attachments[0].name, "Generated image.png");
});

test("classifies Kling MP4 results as video media", () => {
  const url = "https://p4-fdl.klingai.com/generated/opaque-result.mp4";
  const payload = normalizeKlingResultMedia({ text: `Generation complete\n\nMEDIA:${url}` });

  assert.equal(payload.text, "Generation complete");
  assert.deepEqual(payload.attachments, [{
    type: "video",
    url,
    mimeType: "video/mp4",
    name: "Kling generated video 1.mp4"
  }]);
});

test("keeps a Kling video within the OpenClaw delivery limit", async () => {
  const url = "https://p4-fdl.klingai.com/generated/opaque-result.mp4";
  const payload = await normalizeKlingResultMediaForDelivery({
    text: `Generation complete\n\nMEDIA:${url}`
  }, {
    maxVideoBytes: 16 * 1024 * 1024,
    fetchImpl: async () => new Response(null, {
      status: 200,
      headers: {
        "content-type": "video/mp4",
        "content-length": String(8 * 1024 * 1024)
      }
    })
  });

  assert.deepEqual(payload.mediaUrls, [url]);
  assert.deepEqual(payload.attachments, [{
    type: "video",
    url,
    mimeType: "video/mp4",
    name: "Kling generated video 1.mp4"
  }]);
});

test("replaces an oversized Kling video with an inline playback preview", async () => {
  const url = "https://p4-fdl.klingai.com/generated/opaque-result.mp4";
  const previewPath = "/managed-media/kling-preview.mp4";
  const payload = await normalizeKlingResultMediaForDelivery({
    text: `Generation complete\n\nMEDIA:${url}`
  }, {
    maxVideoBytes: 16 * 1024 * 1024,
    fetchImpl: async () => new Response(null, {
      status: 200,
      headers: {
        "content-type": "video/mp4",
        "content-length": String(18 * 1024 * 1024)
      }
    }),
    createVideoPreview: async ({ url: requestedUrl, attachment, maxVideoBytes }) => {
      assert.equal(requestedUrl, url);
      assert.equal(attachment.type, "video");
      assert.equal(maxVideoBytes, 16 * 1024 * 1024);
      return { path: previewPath };
    }
  });

  assert.equal(
    payload.text,
    `Generation complete\n\n[Download original Kling video 1](${url})`
  );
  assert.deepEqual(payload.mediaUrls, [previewPath]);
  assert.deepEqual(payload.attachments, [{
    type: "video",
    url: previewPath,
    mimeType: "video/mp4",
    name: "Kling generated video 1.mp4"
  }]);
});

test("keeps the original link when a video preview cannot be created", async () => {
  const url = "https://p4-fdl.klingai.com/generated/opaque-result.mp4";
  const payload = await normalizeKlingResultMediaForDelivery({
    text: `Generation complete\n\nMEDIA:${url}`
  }, {
    maxVideoBytes: 16 * 1024 * 1024,
    fetchImpl: async () => new Response(null, {
      status: 200,
      headers: {
        "content-type": "video/mp4",
        "content-length": String(18 * 1024 * 1024)
      }
    }),
    createVideoPreview: async () => undefined
  });

  assert.equal(
    payload.text,
    `Generation complete\n\n[Download original Kling video 1](${url})`
  );
  assert.deepEqual(payload.mediaUrls, []);
  assert.deepEqual(payload.attachments, []);
});

test("probes the content type for a fully opaque Kling image URL", async () => {
  const url = "https://p4-fdl.klingai.com/generated/opaque-result-id";
  const requests = [];
  const payload = await normalizeKlingResultMediaForDelivery({
    text: `![Generated image](${url})`
  }, {
    fetchImpl: async (requestedUrl, init) => {
      requests.push({ requestedUrl, method: init.method });
      return new Response(null, {
        status: 200,
        headers: { "content-type": "image/png" }
      });
    }
  });

  assert.deepEqual(requests, [{ requestedUrl: url, method: "HEAD" }]);
  assert.equal(payload.attachments[0].mimeType, "image/png");
  assert.equal(payload.attachments[0].name, "Generated image.png");
});

test("converts an oversized Kling image to a bounded JPEG preview", async () => {
  const url = "https://s15-kling.klingai.com/kimg/opaque-result.png.origin";
  const sourceBuffer = Buffer.alloc(8 * 1024 * 1024);
  const previewBuffer = Buffer.from("jpeg-preview");
  const payload = await normalizeKlingResultMediaForDelivery({
    text: "Generation complete",
    mediaUrls: [url]
  }, {
    maxImageBytes: 6 * 1024 * 1024,
    fetchImpl: async () => new Response(null, {
      status: 200,
      headers: {
        "content-type": "image/png",
        "content-length": String(sourceBuffer.length)
      }
    }),
    readRemoteMediaBuffer: async ({ url: requestedUrl, maxBytes }) => {
      assert.equal(requestedUrl, url);
      assert.equal(maxBytes, 64 * 1024 * 1024);
      return { buffer: sourceBuffer, contentType: "image/png" };
    },
    resizeToJpeg: async ({ buffer, maxSide, quality, withoutEnlargement }) => {
      assert.equal(buffer, sourceBuffer);
      assert.equal(maxSide, 3840);
      assert.equal(quality, 85);
      assert.equal(withoutEnlargement, true);
      return previewBuffer;
    }
  });

  const previewUrl = `data:image/jpeg;base64,${previewBuffer.toString("base64")}`;
  assert.deepEqual(payload.mediaUrls, [previewUrl]);
  assert.deepEqual(payload.attachments, [{
    type: "image",
    url: previewUrl,
    mimeType: "image/jpeg",
    name: "Kling generated image 1.jpg"
  }]);
});

test("checks the downloaded size when Kling omits content-length", async () => {
  const url = "https://s15-kling.klingai.com/kimg/opaque-result.png.origin";
  const sourceBuffer = Buffer.alloc(8 * 1024 * 1024);
  const previewBuffer = Buffer.from("jpeg-preview-without-head-size");
  const payload = await normalizeKlingResultMediaForDelivery({
    text: "Generation complete",
    mediaUrls: [url]
  }, {
    maxImageBytes: 6 * 1024 * 1024,
    fetchImpl: async () => new Response(null, {
      status: 200,
      headers: { "content-type": "image/png" }
    }),
    readRemoteMediaBuffer: async () => ({
      buffer: sourceBuffer,
      contentType: "image/png"
    }),
    resizeToJpeg: async () => previewBuffer
  });

  assert.equal(payload.mediaUrls[0], `data:image/jpeg;base64,${previewBuffer.toString("base64")}`);
  assert.equal(payload.attachments[0].mimeType, "image/jpeg");
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

  assert.equal(payload.attachments[0].mimeType, "image/jpeg");
  assert.equal(payload.attachments[0].name, "Kling generated image 1.jpg");
});
