# OpenClaw release checklist

- Require Node.js 22.22.3+/24.15.0+/25.9.0+ and OpenClaw 2026.7.1-2+.
- Install a local checkout with `openclaw plugins install --link`.
- Pack with `npm pack`, then install the tarball through `openclaw plugins install npm-pack:<tarball> --force` before publishing.
- Inspect `npm pack --dry-run --json`; confirm tests, fixtures, source maps, local docs, and development-only files are absent from the tarball.
- Run `clawhub package publish <tarball> --family code-plugin --dry-run --json`. Use a real public GitHub `source-repo` and matching `source-commit`; do not invent source provenance to bypass ClawHub validation.
- Verify `openclaw plugins list --verbose` reports `Format: openclaw`.
- Verify `openclaw.plugin.json`, `package.json#openclaw.extensions`, the Skills, and the shared MCP bootstrap configuration.
- Verify the package contains `LICENSE`, `README.md`, the runtime entry, manifest, assets, and all declared Skills.
- Verify `/kling-ai` and `/kling-ai-result` are available as native user-invocable Skill commands when `commands.nativeSkills` is enabled.
- Exercise a completed result: confirm the session prints the actual parameter summary, preserved `generationId`, and one numbered media block per output; use `/kling-ai-result 1 <action>` for a single-result next step.
- Open Control UI with `openclaw dashboard` and verify preview, reload persistence, opening the original, full-image download, and image copy independently. Do not mark media actions as passing unless each action is observed end to end.
- Run the media checks on the minimum advertised OpenClaw version from an unmodified official build. Do not treat a locally patched Control UI or Service Worker as proof that the published plugin works on that host version.
- Complete OAuth with `openclaw kling-ai login`; confirm status, refresh behavior, and MCP tools after `openclaw gateway restart`.
- Verify `openclaw kling-ai login --region cn` uses `https://klingai.com/mcp` and `--region global` uses `https://kling.ai/mcp`; switching regions must log out the previous OAuth session and retain only the `Plugin-OpenClaw-kling-ai` server key.
- Verify a new login without `--region` defaults to the global endpoint. A mainland China locale or time zone may recommend `--region cn` but must not switch regions automatically.
- Verify `openclaw kling-ai login` performs PKCE dynamic registration with `client_name` `OpenClaw-Plugin`; keep the terminal running until its loopback callback succeeds.
- Verify generic `openclaw mcp login` remains labeled `OpenClaw MCP`; do not patch or override the OpenClaw host.
- Confirm the bundled MCP bootstrap and any operator-level override both send the non-secret telemetry header `X-Kling-Integration: Plugin-OpenClaw`; a manual generic MCP connection without this header remains distinguishable.
- Confirm missing or altered telemetry does not affect OAuth, rollout, billing, or generation behavior.
- Verify `openclaw mcp logout Plugin-OpenClaw-kling-ai` clears credentials while retaining the server definition.
- Confirm the plugin package contains no local MCP server, `mcp-app`, or token cache. Its loopback OAuth callback binds only to `127.0.0.1` and validates PKCE state.
- Run `openclaw kling-ai login` and confirm it opens the newly emitted authorization URL exactly once, completes the plugin loopback callback, writes the expected `kling-ai-mcp:<region>` Auth Profile, and leaves `openclaw mcp status --json` in `authorized` state.
- Verify a generation turn waits until terminal, records completion into the
  mounted result, and offers a one-shot status follow-up only after an
  interrupted or timed-out wait.
- Do not claim a ClawHub listing until the package is actually published there.
