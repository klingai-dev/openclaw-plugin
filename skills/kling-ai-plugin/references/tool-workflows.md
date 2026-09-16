# Remote tool workflow

This file is the single source of truth for generation-task lifecycle behavior. Image and video skills add creative and parameter guidance only.

## 1. Classify the intent

| Current intent | Known state | Action |
| --- | --- | --- |
| Create new work | No submitted or ambiguous generation for this goal | Validate the live schema, then call one generation tool |
| Explicit retry or variation | The old task failed, or the user explicitly requests another attempt | Reuse the goal's `taskTraceId` and call one new generation |
| View, wait, or check progress | A `generationId` exists | Follow the existing-task path; do not generate |
| Submission response is ambiguous | No task result can be confirmed | Recover or report unknown; never assume no task was created |

“Check again,” “continue,” “is it ready,” and “show the result” refer to the existing task by default.

## 2. Submit once

1. Create a UUIDv7 `taskTraceId` for a new goal; reuse it for the same goal.
2. Read live `tools/list`. Call `who_am_i` immediately before generation or motion control. Reuse the trace ID across discovery, upload, generation, explicit retry, and query.
3. Reuse provider media references exactly. Send only fields, types, enums, and counts declared by the target tool and model.
4. Validate mode, required inputs, and parameters before a billable call.
5. Show the final mode, model, dimensions or resolution, duration, and count, and explain that submission consumes credits. The initial request is not final confirmation.
6. After explicit confirmation, call the generation tool once and preserve `generationId`, `taskTraceId`, and the original status.

## 3. Distinguish accepted, processing, and complete

- An immediate response containing `generationId` means accepted or created, not complete.
- `creditsConsumed` is billing metadata, not completion evidence.
- For non-terminal states, say only “submitted” or “processing.”
- On terminal failure, report the provider message and preserve IDs without retrying.
- Claim completion only when the task is terminal-success and at least one work has a usable `urlWithoutWatermark` or `url`.
- Terminal success without usable media is an output inconsistency. Report it and preserve IDs.

## 4. Keep one refresh owner

| Scenario | Model action |
| --- | --- |
| OpenClaw mounted the generation widget | Do not call `query_tasks` or `query_result`; the widget refreshes itself |
| No widget; generation just returned | Return current status, task ID, and text fallback; do not poll |
| User later asks for status | Call UI-free `query_tasks` once when `generationId` exists |
| User later asks to display the task | Call live `query_result` once to mount a widget, otherwise `query_tasks` once |

A mounted widget is the only media preview. Do not duplicate it with Markdown media, attachments, thumbnails, cards, or download links.

## 5. Normalize results

1. Compare task and work statuses case-insensitively and use the live schema for terminal states.
2. Filter explicitly failed works. Do not infer failure when work `status` is absent.
3. Prefer `urlWithoutWatermark`, then `url`.
4. Treat `coverUrlWithoutWatermark` and `coverUrl` only as thumbnails. A video cover is not a completed video.
5. Without a widget, report the successful work count and at most one primary link. Never log signed URLs or treat them as permanent asset IDs.

## 6. Handle ambiguity and retries

- With `generationId`, query once only when the user currently asks.
- Without `generationId`, `query_tasks` cannot locate the task. Use only a live list or trace-query capability; otherwise preserve `taskTraceId`, report unknown, and stop.
- Never infer that no task was created merely because it cannot be queried.
- Replay only when the live tool explicitly guarantees idempotency. Otherwise, a new generation requires an explicit user request for a retry or variation.
- For an explicit retry of the same goal, reuse `taskTraceId`; the new attempt receives a new `generationId`.

Stop after one confirmed generation, one requested query snapshot, delegation to a mounted widget, or an unrecoverable unknown-state report.
