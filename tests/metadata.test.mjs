import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageMetadata = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
const pluginManifest = JSON.parse(readFileSync(new URL("../openclaw.plugin.json", import.meta.url)));
const klingSkill = readFileSync(new URL("../skills/kling-ai/SKILL.md", import.meta.url), "utf8");

test("keeps release and compatibility metadata aligned", () => {
  assert.equal(packageMetadata.version, pluginManifest.version);
  assert.equal(packageMetadata.openclaw.install.minHostVersion, ">=2026.7.1-2");
  assert.equal(packageMetadata.openclaw.compat.pluginApi, ">=2026.7.1-2");
  assert.equal(packageMetadata.peerDependencies.openclaw, ">=2026.7.1-2");
});

test("keeps ClawHub discovery metadata aligned", () => {
  assert.equal(pluginManifest.name, "Kling AI（可灵 AI）");
  assert.equal(packageMetadata.description, pluginManifest.description);
  assert.ok(Array.from(packageMetadata.description).length <= 200);
  assert.match(packageMetadata.description, /image and video generation/gu);
  assert.match(packageMetadata.description, /text-to-image/gu);
  assert.match(packageMetadata.description, /image-to-video/gu);
});

test("keeps MCP bootstrap compatible with the stable plugin manifest", () => {
  assert.equal(Object.hasOwn(pluginManifest, "mcpServers"), false);
  assert.ok(packageMetadata.files.includes("dist/"));
});

test("routes normal generation without a who_am_i preflight", () => {
  assert.match(klingSkill, /Do not call `who_am_i` first/gu);
  assert.match(klingSkill, /without a `who_am_i` preflight/gu);
  assert.doesNotMatch(klingSkill, /declared in `openclaw\.plugin\.json`/gu);
});
