# Remote tool workflow

1. Select the matching generation tool from the live schemas that the host already exposes for the configured remote `Plugin-OpenClaw-kling-ai` server. Do not call `who_am_i` before a normal generation request.
2. For attached media, call the remote upload tool and pass its returned reference to the generation request.
3. Show the final billable settings and obtain explicit confirmation.
4. Call the selected remote generation tool exactly once and preserve its `generationId`.
5. Use remote `query_tasks` for status. If the remote result includes an MCP App resource, let the host render it; otherwise present the returned content and one primary output link.

Call `who_am_i` only when the user explicitly asks which account is authorized or requests an authorization-status diagnostic. The plugin has no local MCP server or mock runtime. Never retry a generation automatically.
