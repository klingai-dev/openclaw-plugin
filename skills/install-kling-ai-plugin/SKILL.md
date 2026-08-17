---
name: install-kling-ai-plugin
description: Install, refresh, or troubleshoot the Kling AI OpenClaw plugin and native MCP registration. Use for plugin installation, enablement, gateway restart, or OAuth login. Preserve the bundled server key and telemetry header exactly.
---

# Install the Kling AI plugin in OpenClaw

1. Treat `kling-mcp-config.mjs` as the source of truth for the remote MCP definition and `openclaw.plugin.json` as the source of truth for plugin metadata.
2. Preserve the exact server key `Plugin-OpenClaw-kling-ai`, endpoint, OAuth settings, and `X-Kling-Integration` header. Do not reconstruct them from memory.
3. Use OpenClaw's native plugin install and enable commands; do not create a parallel manual MCP registration.
4. Re-read the installed MCP bootstrap configuration and verify the effective server entry before restarting the gateway.
5. Use `openclaw kling-ai login --region cn` for China accounts or `openclaw kling-ai login --region global` for international accounts. An explicit region switch must log out the previous OAuth session and keep only the `Plugin-OpenClaw-kling-ai` server entry.
6. Leave credential entry to the user.
