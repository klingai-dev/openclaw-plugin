# Remote tool workflow

This file is the single source of truth for generation-task lifecycle behavior. Image and video skills add creative and parameter guidance only.

## 1. Classify the intent

| Current intent | Known state | Action |
| --- | --- | --- |
| Create new work | No submitted or ambiguous generation for this goal | Prepare final settings and obtain explicit authorization before calling one generation tool |
| Explicit retry or variation | The user gives fresh explicit authorization for another attempt | Reuse the goal’s `taskTraceId` and call one new generation |
| View, wait, or check progress | A `generationId` exists | Follow the existing-task path; do not generate |
| Submission response is ambiguous | No task result can be confirmed | Follow the ambiguity rules below. Without a task ID, report unknown and stop. |

“Check again,” “continue,” “is it ready,” and “show the result” refer to the existing task by default. An unchanged balance or absent history entry does not establish that the previous attempt failed or incurred no charge. A further submission needs fresh authorization for its final settings.

## 2. Submit once

1. Create a UUIDv7 `taskTraceId` for a new goal; reuse it for the same goal.
2. Read live `tools/list`. Follow [capability discovery](capability-discovery.md) before selecting a tool/model pair; reuse successful discovery during the same preparation unless invalidated. Reuse the trace ID across discovery, upload, generation, explicit retry, and query.
3. Reuse provider media references exactly. Send only fields, types, enums, and counts declared by the target tool and model.
4. Validate mode, required inputs, and parameters before a billable call.
5. Show the applicable mode, model, prompt summary, resolution or dimensions, aspect ratio, duration, count, shot structure, and reference roles. Explain that submission consumes credits and include live tool or model billing disclosures. Honor approval for the same unsubmitted intent and unchanged final settings. A general request to generate, an upload, a library operation, or a credit check does not approve final settings. Wait for approval when needed.
6. Once authorized, call the generation tool once. A rejected call counts as an attempt. Preserve any returned `generationId`, `taskTraceId`, and original status.

## 3. Distinguish accepted, processing, and complete

- When reporting a submission or query, use the actual returned status, the known task ID, and any result link allowed by the display rules below. Describe effective settings when known.
- An immediate response containing `generationId` means accepted or created, not complete.
- Report an actual charge only when the tool returns one, such as `creditsConsumed`. If billing is relevant and the tool omits the charge, report it as unknown. Attempt counts and local tool budgets do not measure credits. Billing data does not establish completion.
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
- If the submission returns no `generationId` and none is known for that attempt, preserve `taskTraceId`. Report the actual error and any unknown creation or billing state, then stop. Do not call or offer a task query. `query_tasks` requires a task ID and cannot search history or look up a task by trace ID. A query response omitting the ID does not invalidate an already known ID.
- Never replay automatically. Any further submission requires fresh explicit authorization.
- For an explicit retry of the same goal, reuse `taskTraceId`; the new attempt receives a new `generationId`.

Stop after one confirmed generation, one requested query snapshot, delegation to a mounted widget, or an unrecoverable unknown-state report.
