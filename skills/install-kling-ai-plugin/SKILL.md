---
name: install-kling-ai-plugin
description: Install, refresh, or troubleshoot the Kling AI OpenClaw plugin and native MCP registration. Use for plugin installation, enablement, gateway restart, or OAuth login. Preserve the manifest server key and telemetry header exactly.
---

# Install the Kling AI plugin in OpenClaw

1. Treat `openclaw.plugin.json` as the source of truth.
2. Preserve the exact server key `Plugin-OpenClaw-kling-ai`, endpoint, OAuth settings, and `X-Kling-Integration` header. Do not reconstruct them from memory.
3. Use OpenClaw's native plugin install and enable commands; do not create a parallel manual MCP registration.
4. Re-read the installed manifest and verify the effective server entry before restarting the gateway.
5. Use the plugin's native login command and leave credential entry to the user.
