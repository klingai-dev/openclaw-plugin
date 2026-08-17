---
name: kling-ai-result
description: Continue an OpenClaw Kling AI result action for one numbered media item using the current conversation and generationId.
---

# Kling AI result action

Use this native OpenClaw skill command after `kling-ai` has printed a numbered
media result. The command is handled by the Agent in the current session; it
does not create a webpage, popup, custom button, or browser flow.

## Input

The raw command is:

```text
/kling-ai-result [item-number] <action>
```

Resolve the optional item number and action against the most recent Kling result
in the current conversation and preserve its `generationId`. When there is only
one result, the item number may be omitted. If the result is missing or the action
is ambiguous, ask one concise clarification question and do not call a generation
tool.

## Action rules

- For inspect, describe, compare, or status, use the existing conversation
  context and read-only MCP tools; query a task once when status is requested.
- For download, export, or attach, use the native Agent/media handling
  available on the current OpenClaw surface and the selected item's URL. Do
  not invent a second result or resubmit generation.
- For edit, extend, or regenerate, summarize the requested billable settings
  and obtain confirmation before any new generation call. A new intent gets a
  new `generationId`.
- Keep the response item-scoped: report the selected media, its role, the
  preserved `generationId`, and the next state or action.
- Never expose bearer headers, cookies, tokens, or signed URLs in logs.
