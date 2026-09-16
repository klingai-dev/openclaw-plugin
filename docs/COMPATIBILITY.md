# Compatibility and validation scope

This package uses OpenClaw's native declarative plugin format. `openclaw.plugin.json` declares the bundled skills and remote MCP server, while the minimal runtime entry point registers no additional tools, hooks, or local services.

Install published releases with `openclaw plugins install clawhub:kling-ai-openclaw`. Git installs remain available for development builds. The manifest supplies the default MCP URL, OAuth mode, timeouts, and concurrency policy. Operator configuration may override those defaults. OpenClaw owns sign-in, token refresh, and sign-out.

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

## 1.1.15 installation validation

- Installed the release archive through the official `plugins install` command in an isolated state directory.
- `plugins inspect kling-ai --json` reported version `1.1.15`, `format: openclaw`, `status: loaded`, the expected skills and MCP server, and no diagnostics.
- This validation did not repeat browser authorization or a billable generation.

## Remaining live validation

1. Automatic refresh after OAuth access-token expiry
2. Live account and credit lookup against a global account
3. One confirmed image task and one confirmed video task, including query and failure behavior
4. MCP App rendering in Control UI and text/media fallback in target messaging channels

Billable generation and multi-channel validation remain pending.
