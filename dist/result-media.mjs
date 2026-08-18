import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const KLING_IMAGE_MARKDOWN = /!\[([^\]]*)\]\((https:\/\/[^\s)]+)\)/giu;
const KLING_MEDIA_DIRECTIVE = /(^|\n)MEDIA:(https:\/\/[^\s]+)/giu;
const IMAGE_MIME_BY_EXTENSION = new Map([
  ["avif", "image/avif"],
  ["gif", "image/gif"],
  ["jpeg", "image/jpeg"],
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"]
]);
const IMAGE_EXTENSION_BY_MIME = new Map([
  ["image/avif", "avif"],
  ["image/gif", "gif"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);
const VIDEO_MIME_BY_EXTENSION = new Map([
  ["mov", "video/quicktime"],
  ["mp4", "video/mp4"],
  ["webm", "video/webm"]
]);
const VIDEO_EXTENSION_BY_MIME = new Map([
  ["video/mp4", "mp4"],
  ["video/quicktime", "mov"],
  ["video/webm", "webm"]
]);
const MEDIA_FILENAME_EXTENSION = /\.(?:avif|gif|jpe?g|mov|mp4|png|webm|webp)$/iu;
const DEFAULT_KLING_IMAGE_MIME_TYPE = "image/jpeg";
const MIME_PROBE_TIMEOUT_MS = 2_000;
const MAX_KLING_SOURCE_IMAGE_BYTES = 64 * 1024 * 1024;
const MAX_KLING_SOURCE_VIDEO_BYTES = 128 * 1024 * 1024;
const VIDEO_PREVIEW_HEADROOM_BYTES = 512 * 1024;
const VIDEO_PREVIEW_TIERS = [
  { width: 1280, height: 720, crf: 26 },
  { width: 960, height: 540, crf: 29 },
  { width: 640, height: 360, crf: 32 }
];

function isKlingMediaUrl(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return ["klingai.com", "kling.ai"].some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
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

function inferredMediaMimeType(attachment, url) {
  if (typeof attachment?.mimeType === "string") {
    const mimeType = attachment.mimeType.split(";", 1)[0].trim().toLowerCase();
    if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) return mimeType;
  }

  try {
    const match = new URL(url).pathname.match(/\.(avif|gif|jpe?g|mov|mp4|png|webm|webp)(?:\.[a-z0-9]+)*$/iu);
    const extension = match?.[1].toLowerCase();
    const inferred = extension
      ? IMAGE_MIME_BY_EXTENSION.get(extension) ?? VIDEO_MIME_BY_EXTENSION.get(extension)
      : undefined;
    if (inferred) return inferred;
  } catch {
    // isKlingMediaUrl already validated discovered URLs.
  }

  return undefined;
}

function mediaMimeType(attachment, url) {
  return inferredMediaMimeType(attachment, url) ?? DEFAULT_KLING_IMAGE_MIME_TYPE;
}

function mediaType(mimeType) {
  return mimeType.startsWith("video/") ? "video" : "image";
}

function mediaName(alt, index, mimeType) {
  const name = alt.replace(/\s+/gu, " ").trim();
  const kind = mediaType(mimeType);
  const baseName = name || `Kling generated ${kind} ${index + 1}`;
  if (MEDIA_FILENAME_EXTENSION.test(baseName)) return baseName;
  const extension = IMAGE_EXTENSION_BY_MIME.get(mimeType)
    ?? VIDEO_EXTENSION_BY_MIME.get(mimeType)
    ?? "jpg";
  return `${baseName}.${extension}`;
}

function replaceMediaNameExtension(name, mimeType) {
  const extension = IMAGE_EXTENSION_BY_MIME.get(mimeType) ?? VIDEO_EXTENSION_BY_MIME.get(mimeType);
  if (!extension) return name;
  return `${name.replace(MEDIA_FILENAME_EXTENSION, "")}.${extension}`;
}

async function probeMediaMetadata(url, fetchImpl) {
  if (typeof fetchImpl !== "function") return {};

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MIME_PROBE_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      method: "HEAD",
      signal: controller.signal
    });
    if (!response.ok) return {};
    const mimeType = response.headers?.get?.("content-type")?.split(";", 1)[0].trim().toLowerCase();
    const contentLength = Number(response.headers?.get?.("content-length"));
    return {
      ...(mimeType?.startsWith("image/") || mimeType?.startsWith("video/") ? { mimeType } : {}),
      ...(Number.isSafeInteger(contentLength) && contentLength > 0 ? { sizeBytes: contentLength } : {})
    };
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

function appendVideoFallbackLinks(text, links) {
  if (links.length === 0) return text;
  const existing = typeof text === "string" ? text.trim() : "";
  const markdown = links.map(({ url, index }) => `[Download original Kling video ${index + 1}](${url})`);
  return [existing, ...markdown].filter(Boolean).join("\n\n");
}

async function createImagePreviewDataUrl(url, options) {
  if (
    typeof options.readRemoteMediaBuffer !== "function"
    || typeof options.resizeToJpeg !== "function"
  ) return undefined;

  try {
    const source = await options.readRemoteMediaBuffer({
      url,
      maxBytes: MAX_KLING_SOURCE_IMAGE_BYTES,
      timeoutMs: 15_000
    });
    if (source.buffer.length <= options.maxImageBytes) return undefined;
    const buffer = await options.resizeToJpeg({
      buffer: source.buffer,
      maxSide: 3_840,
      quality: 85,
      withoutEnlargement: true
    });
    if (buffer.length > options.maxImageBytes) return undefined;
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

async function createVideoPreviewFile(url, attachment, options) {
  if (
    typeof options.readRemoteMediaBuffer !== "function"
    || typeof options.runFfmpeg !== "function"
    || typeof options.saveMediaBuffer !== "function"
    || !Number.isSafeInteger(options.maxVideoBytes)
  ) return undefined;

  const targetBytes = options.maxVideoBytes - VIDEO_PREVIEW_HEADROOM_BYTES;
  if (targetBytes <= 0) return undefined;

  let directory;
  try {
    const source = await options.readRemoteMediaBuffer({
      url,
      maxBytes: MAX_KLING_SOURCE_VIDEO_BYTES,
      timeoutMs: 60_000
    });
    const savePreview = async (buffer) => options.saveMediaBuffer(
      buffer,
      "video/mp4",
      "outbound",
      options.maxVideoBytes,
      replaceMediaNameExtension(attachment.name, "video/mp4"),
      "kling-preview.mp4"
    );

    if (source.buffer.length <= targetBytes) return await savePreview(source.buffer);

    directory = await mkdtemp(join(tmpdir(), "kling-openclaw-video-"));
    const inputPath = join(directory, "input.mp4");
    const outputPath = join(directory, "preview.mp4");
    await writeFile(inputPath, source.buffer);

    for (const tier of VIDEO_PREVIEW_TIERS) {
      await rm(outputPath, { force: true });
      try {
        await options.runFfmpeg([
          "-hide_banner",
          "-loglevel", "error",
          "-y",
          "-i", inputPath,
          "-map", "0:v:0",
          "-map", "0:a:0?",
          "-sn",
          "-dn",
          "-vf", `scale=${tier.width}:${tier.height}:force_original_aspect_ratio=decrease:force_divisible_by=2`,
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-crf", String(tier.crf),
          "-pix_fmt", "yuv420p",
          "-c:a", "aac",
          "-b:a", "96k",
          "-movflags", "+faststart",
          outputPath
        ], { timeoutMs: 120_000 });
        const preview = await readFile(outputPath);
        if (preview.length > 0 && preview.length <= targetBytes) {
          return await savePreview(preview);
        }
      } catch {
        // Try the next, smaller rendition before falling back to the original link.
      }
    }
  } catch {
    return undefined;
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true }).catch(() => {});
  }

  return undefined;
}

export function normalizeKlingResultMedia(payload) {
  if (!payload || typeof payload !== "object") return payload;

  const discovered = [];
  const text = typeof payload.text === "string"
    ? payload.text
      .replace(KLING_IMAGE_MARKDOWN, (match, alt, url) => {
        if (!isKlingMediaUrl(url)) return match;
        discovered.push({ alt, url });
        return "";
      })
      .replace(KLING_MEDIA_DIRECTIVE, (match, prefix, url) => {
        if (!isKlingMediaUrl(url)) return match;
        discovered.push({ alt: "", url });
        return prefix;
      })
      .replace(/\n{3,}/gu, "\n\n")
      .trim()
    : payload.text;

  const nativeMediaUrls = [
    ...(Array.isArray(payload.mediaUrls) ? payload.mediaUrls : []),
    ...(typeof payload.mediaUrl === "string" ? [payload.mediaUrl] : [])
  ].filter((url) => typeof url === "string" && url.trim());

  if (discovered.length === 0 && !nativeMediaUrls.some(isKlingMediaUrl)) return payload;

  const mediaUrls = [...new Set([
    ...nativeMediaUrls,
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
        alt: image.alt,
        index
      });
    }
  }

  const attachments = mediaUrls.map((url, index) => {
    const existing = attachmentByReference.get(url.trim()) ?? existingAttachments[index];
    const image = discoveredByUrl.get(url) ?? (isKlingMediaUrl(url)
      ? { alt: "", index }
      : undefined);
    if (!image) return existing ?? {};
    const mimeType = mediaMimeType(existing, url);
    const existingName = typeof existing?.name === "string" && existing.name.trim()
      ? existing.name.trim()
      : undefined;

    return {
      ...(existing ?? {}),
      type: mediaType(mimeType),
      ...(attachmentReference(existing) ? {} : { url }),
      mimeType,
      name: existingName && MEDIA_FILENAME_EXTENSION.test(existingName)
        ? existingName
        : mediaName(existingName ?? image.alt, image.index, mimeType)
    };
  });

  return {
    ...payload,
    text,
    ...(typeof payload.mediaUrl === "string" ? { mediaUrl: undefined } : {}),
    mediaUrls,
    attachments
  };
}

export async function normalizeKlingResultMediaForDelivery(payload, options = {}) {
  const normalized = normalizeKlingResultMedia(payload);
  if (normalized === payload || !Array.isArray(normalized.attachments)) return normalized;

  const existingAttachments = Array.isArray(payload.attachments) ? payload.attachments : [];
  const existingByReference = new Map();
  for (const attachment of existingAttachments) {
    const reference = attachmentReference(attachment);
    if (reference && !existingByReference.has(reference)) existingByReference.set(reference, attachment);
  }

  const mediaUrls = [...(normalized.mediaUrls ?? [])];
  const prepared = await Promise.all(normalized.attachments.map(async (attachment, index) => {
    const url = mediaUrls[index];
    if (typeof url !== "string") return { attachment, url };
    const existing = existingByReference.get(url.trim()) ?? existingAttachments[index];
    const probed = await probeMediaMetadata(url, options.fetchImpl ?? globalThis.fetch);
    const mimeType = probed.mimeType ?? inferredMediaMimeType(existing, url) ?? attachment.mimeType;
    const type = mediaType(mimeType);
    const updated = {
      ...attachment,
      type,
      mimeType,
      name: replaceMediaNameExtension(attachment.name, mimeType)
    };

    if (
      type === "video"
      && Number.isSafeInteger(options.maxVideoBytes)
      && (!probed.sizeBytes || probed.sizeBytes > options.maxVideoBytes)
    ) {
      const preview = typeof options.createVideoPreview === "function"
        ? await options.createVideoPreview({ url, attachment: updated, maxVideoBytes: options.maxVideoBytes })
        : await createVideoPreviewFile(url, updated, options);
      if (preview?.path) {
        return {
          attachment: {
            ...updated,
            url: preview.path,
            mimeType: "video/mp4",
            name: replaceMediaNameExtension(updated.name, "video/mp4")
          },
          url: preview.path,
          fallback: { url, index }
        };
      }
      return { fallback: { url, index } };
    }

    if (
      type === "image"
      && Number.isSafeInteger(options.maxImageBytes)
      && (!probed.sizeBytes || probed.sizeBytes > options.maxImageBytes)
    ) {
      const previewUrl = await createImagePreviewDataUrl(url, options);
      if (previewUrl) {
        mediaUrls[index] = previewUrl;
        return { attachment: {
          ...updated,
          url: previewUrl,
          mimeType: "image/jpeg",
          name: replaceMediaNameExtension(updated.name, "image/jpeg")
        }, url: previewUrl };
      }
    }
    return { attachment: updated, url };
  }));

  const deliverable = prepared.filter(({ attachment, url }) => attachment && url);
  const fallbackLinks = prepared.flatMap(({ fallback }) => fallback ? [fallback] : []);

  return {
    ...normalized,
    text: appendVideoFallbackLinks(normalized.text, fallbackLinks),
    mediaUrls: deliverable.map(({ url }) => url),
    attachments: deliverable.map(({ attachment }) => attachment)
  };
}
