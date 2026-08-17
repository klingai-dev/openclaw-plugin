const KLING_IMAGE_MARKDOWN = /!\[([^\]]*)\]\((https:\/\/[^\s)]+)\)/giu;

function isKlingMediaUrl(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "klingai.com" || hostname.endsWith(".klingai.com");
  } catch {
    return false;
  }
}

function attachmentReference(attachment) {
  if (!attachment || typeof attachment !== "object") return undefined;

  for (const key of ["path", "url", "mediaUrl", "filePath"]) {
    if (typeof attachment[key] === "string" && attachment[key].trim()) {
      return attachment[key].trim();
    }
  }

  return undefined;
}

function imageName(alt, index) {
  const name = alt.replace(/\s+/gu, " ").trim();
  return name || `Kling generated image ${index + 1}`;
}

export function normalizeKlingResultMedia(payload) {
  if (!payload || typeof payload.text !== "string") return payload;

  const discovered = [];
  const text = payload.text.replace(KLING_IMAGE_MARKDOWN, (match, alt, url) => {
    if (!isKlingMediaUrl(url)) return match;
    discovered.push({ alt, url });
    return "";
  }).replace(/\n{3,}/gu, "\n\n").trim();

  if (discovered.length === 0) return payload;

  const mediaUrls = [...new Set([
    ...(Array.isArray(payload.mediaUrls) ? payload.mediaUrls : []),
    ...(typeof payload.mediaUrl === "string" ? [payload.mediaUrl] : []),
    ...discovered.map(({ url }) => url)
  ])];

  const existingAttachments = Array.isArray(payload.attachments) ? payload.attachments : [];
  const attachmentByReference = new Map();
  for (const attachment of existingAttachments) {
    const reference = attachmentReference(attachment);
    if (reference && !attachmentByReference.has(reference)) {
      attachmentByReference.set(reference, attachment);
    }
  }

  const discoveredByUrl = new Map();
  for (const [index, image] of discovered.entries()) {
    if (!discoveredByUrl.has(image.url)) {
      discoveredByUrl.set(image.url, {
        name: imageName(image.alt, index)
      });
    }
  }

  const attachments = mediaUrls.map((url, index) => {
    const existing = attachmentByReference.get(url.trim()) ?? existingAttachments[index];
    const image = discoveredByUrl.get(url);
    if (!image) return existing ?? {};

    return {
      ...(existing ?? {}),
      type: "image",
      ...(attachmentReference(existing) ? {} : { url }),
      name: typeof existing?.name === "string" && existing.name.trim()
        ? existing.name
        : image.name
    };
  });

  return {
    ...payload,
    text,
    mediaUrls,
    attachments
  };
}
