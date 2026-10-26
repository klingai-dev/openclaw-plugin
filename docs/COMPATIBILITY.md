# Compatibility and validation scope

This package uses OpenClaw's native declarative plugin format. `openclaw.plugin.json` declares the bundled skills and remote MCP server, while the minimal runtime entry point registers no additional tools, hooks, or local services.

Install published releases with `openclaw plugins install clawhub:kling-ai-global-openclaw`. Git installs remain available for development builds. The manifest supplies the default MCP URL, OAuth mode, timeouts, and concurrency policy. Operator configuration may override those defaults. OpenClaw owns sign-in, token refresh, and sign-out.

References: [plugin installation](https://docs.openclaw.ai/cli/plugins/install), [native manifest](https://docs.openclaw.ai/plugins/manifest), and [MCP OAuth](https://docs.openclaw.ai/cli/mcp/transports). Commands were checked against OpenClaw 2026.9.4.

## Static checks

- Native plugin manifest, minimal entry point, and one global remote MCP endpoint
- Frontmatter and local references for all three skills
- Distribution allowlist with no local MCP runtime or credential files
- OpenClaw 2026.9.4 plugin format detection and MCP transport parsing

## Runtime checks

- OpenClaw 2026.9.4 can load the plugin and its remote OAuth MCP definition.
- Operator OAuth configuration with the same server key merges into one `kling-ai` service.
- `openclaw mcp doctor kling-ai --probe` returns `ok` in a configured environment.
- The MCP exposes image generation, video generation, uploads, Elements, motions, credits, and task queries.
- The optional sign-in helper opens only the expected authorization host and covers existing login, CLI failure, and browser failure cases.

## 1.1.17 installation validation

- Installed the release archive through the official `plugins install` command in an isolated state directory.
- `plugins inspect kling-ai-global --json` reported version `1.1.17`, `format: openclaw`, `status: loaded`, the expected skills and MCP server, and no diagnostics.
- This validation did not repeat browser authorization or a billable generation.

## Remaining live validation

1. Automatic refresh after OAuth access-token expiry
2. Live account and credit lookup against a global account
3. One confirmed image task and one confirmed video task, including query and failure behavior
4. MCP App rendering in Control UI and text/media fallback in target messaging channels

Billable generation and multi-channel validation remain pending.

## 1.1.18 validation scope

Adds live V4 / V4 Flash discovery, omni reference, conditional reference caps, and audio constraints. The MCP server key is now `kling-ai`, while the plugin ID remains `kling-ai-global`; migrate the old operator entry as described in the README. Local checks do not establish real OAuth or paid-generation validation. The 1.1.17 evidence above is historical and does not validate this release.

## 1.1.19 MCP Apps setup

- Updated all three Skills and installation instructions to check the host-wide MCP Apps setting, enable it under user authorization, restart the Gateway, and verify actual mounting. Native plugin installation does not enable this setting; no startup mutation or local renderer was added.
- Both regional packages are version 1.1.19. Minimum host/API compatibility and historical build evidence remain 2026.9.4; documentation includes the 2026.10.6 stable upgrade path, not a claim of runtime validation on that version.
- Reference: [OpenClaw 2026.10.6 MCP Apps](https://github.com/openclaw/openclaw/blob/v2026.10.6/docs/cli/mcp/apps.md). UI source, MCP endpoint, OAuth, billing and result fallback contracts are unchanged. Fresh affected-host UI acceptance is still required; do not resubmit paid generation to validate configuration.

## 1.1.20

Release version increment only; preserve the MCP Apps setup guidance and runtime behavior from 1.1.19. Version 1.1.19 remains reserved after a ClawHub scanner operational failure. This version enters a fresh full review; publication or security approval is not implied.

## 1.1.21

Clarify MCP registration names versus underscore identifiers in code mode. Follow actual tool declarations; preserve installation and configuration identities. No generation, OAuth, or UI runtime changes.

## 1.1.22

The entry Skill is renamed from `kling-ai-global-plugin` to `kling-ai` so it no longer collides with same-named Skills from other packages (same name as the China package, so install only one regional package per OpenClaw instance). No generation, OAuth, MCP, or UI runtime changes.

## 1.1.23

The entry Skill adds a coexistence rule for the universal plugin's `kling-ai-plugin` Skill: this Skill governs, and polling or extra-link rules from the other Skill are not applied, preventing a second result card. No generation, OAuth, MCP, or UI runtime changes.
