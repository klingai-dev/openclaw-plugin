const KLING_IMAGE_MARKDOWN = /!\[([^\]]*)\]\((https:\/\/[^\s)]+)\)/giu;

function isKlingMediaUrl(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "klingai.com" || hostname.endsWith(".klingai.com");
  } catch {
    return false;
  }
}

export function normalizeKlingResultMedia(payload) {
  if (!payload || typeof payload.text !== "string") return payload;

  const discovered = [];
  const text = payload.text.replace(KLING_IMAGE_MARKDOWN, (match, _alt, url) => {
    if (!isKlingMediaUrl(url)) return match;
    discovered.push(url);
    return "";
  }).replace(/\n{3,}/gu, "\n\n").trim();

  if (discovered.length === 0) return payload;

  const mediaUrls = [...new Set([
    ...(Array.isArray(payload.mediaUrls) ? payload.mediaUrls : []),
    ...(typeof payload.mediaUrl === "string" ? [payload.mediaUrl] : []),
    ...discovered
  ])];

  return {
    ...payload,
    text,
    mediaUrls
  };
}
