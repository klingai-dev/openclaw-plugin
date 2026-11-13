# Remote tool workflow

This file is the single source of truth for generation-task lifecycle behavior. Image and video skills add creative and parameter guidance only.

## 1. Classify the intent

| Current intent | Known state | Action |
| --- | --- | --- |
| Create new work | No submitted or ambiguous generation for this goal | Prepare final settings and obtain explicit authorization before calling one generation tool |
| Explicit retry or variation | The user gives fresh explicit authorization for another attempt | Reuse the goal’s `taskTraceId` and call one new generation |
| Explicitly continue after a top-up | A request in this conversation paused for credits | Follow [resume after insufficient credits](#resume-after-insufficient-credits) |
| View, wait, or check progress | A `generationId` exists | Follow the existing-task path; do not generate |
| Submission response is ambiguous | No task result can be confirmed | Follow the ambiguity rules below. Without a task ID, report unknown and stop. |

“Check again,” “continue,” “is it ready,” and “show the result” refer to the existing task by default. An unchanged balance or absent history entry does not establish that the previous attempt failed or incurred no charge. A further submission needs fresh authorization for its final settings.

## 2. Submit once

1. Create a UUIDv7 `taskTraceId` for a new goal; reuse it for the same goal.
2. Read live `tools/list`. Follow [capability discovery](capability-discovery.md) before selecting a tool/model pair; reuse successful discovery during the same preparation unless invalidated. Reuse the trace ID across discovery, upload, generation, explicit retry, and query.
3. Reuse provider media references exactly. Send only fields, types, enums, and counts declared by the target tool and model.
4. Validate mode, required inputs, and parameters before a billable call.
5. Show the applicable mode, model, prompt summary, resolution or dimensions, aspect ratio, duration, count, shot structure, and reference roles. Explain that submission consumes credits and include live tool or model billing disclosures. Honor approval for the same unsubmitted intent and unchanged final settings. A general request to generate, an upload, a library operation, or a credit check does not approve final settings. Wait for approval when needed.
6. After approval, call `query_membership_and_credits` on the same connection immediately before the billable submission. If the current balance is unavailable, keep the request, pause submission, and report that the balance could not be confirmed. If the balance is non-positive, the service explicitly reports insufficient credits, or its live estimate for the same settings exceeds the balance, pause as described below. A positive balance alone does not establish affordability when no estimate is available. Read-only status or library requests need no credit check.
7. After the credit check passes, call the generation tool once. A rejected call counts as an attempt. Preserve any returned `generationId`, `taskTraceId`, and original status. Follow the recovery flow if the service rejects the request for insufficient credits.

### Resume after insufficient credits

1. Keep the intent, tool, canonical model ID, prompt, settings, media slots, usable media references, `taskTraceId`, submission state, and any known `generationId` in the current conversation. Distinguish a pause before submission, an explicit service rejection, and an unconfirmed submission. Quantify the shortfall only when the service returns a live estimate for the same settings.
2. Use the official top-up entry returned by the current connection for the account's region. If none is returned, direct the user to sign in to the same account on the [Kling AI global site](https://kling.ai/). Ask them to return to this conversation and say “Continue my last generation” after topping up. If they only report a top-up, check the balance and wait for an explicit request to continue.
3. On an explicit request to continue, use the original request if it is uniquely identifiable in this conversation. If several match, ask which one to continue. When this attempt has a task ID, follow the [existing-task flow](#4-keep-one-refresh-owner) first, using the mounted widget or querying the original task once. Submit only if no generation call was sent or the service confirms that no task was created and no charge occurred. If the previous submission remains ambiguous, follow the ambiguity rules and stop.
4. On the original account, recheck the model, original settings, and media validity. Reuse `taskTraceId` and still-valid media references. Replace expired references from the accessible source material and ask only for media that cannot be recovered. An explicit request to continue authorizes one submission with the same previously approved settings. If the model or billable settings must change, ask the user to choose. Recheck credits and follow the single-submission steps. Keep the request pending if credits remain insufficient.

## 3. Distinguish accepted, processing, and complete

- When reporting a submission or query, use the actual returned status, the known task ID, and any result link allowed by the display rules below. Describe effective settings when known.
- An immediate response containing `generationId` means accepted or created, not complete.
- Report an actual charge only when the tool returns one, such as `creditsConsumed`. If billing is relevant and the tool omits the charge, report it as unknown. Attempt counts and local tool budgets do not measure credits. Billing data does not establish completion.
- For non-terminal states, say only “submitted” or “processing.”
- On terminal failure, report the provider message and preserve IDs without retrying.
- Report full completion only when the task is terminal-success and the type and count of usable results meet the request. If only some results are usable, deliver them under the display rules below and report the actual count, for example “Generated 2 of 3 images.” If the target count is unknown, report the confirmed count.
- Terminal success without usable media is an output inconsistency. Report it and preserve IDs.

## 4. Keep one refresh owner

| Scenario | Model action |
| --- | --- |
| OpenClaw mounted the generation widget | Do not call `query_tasks` or `query_result`; the widget refreshes itself |
| No widget; generation just returned | Return current status, task ID, and text fallback; do not poll |
| User later asks for status or reports a missing result, and no widget is mounted | Call UI-free `query_tasks` once when this attempt has a `generationId` |
| User later asks to display the task | Call live `query_result` once to mount a widget, otherwise `query_tasks` once |

A mounted widget is the only media preview. Do not duplicate it with Markdown media, attachments, thumbnails, cards, or download links.

If a query returns an invalid resource, a rate limit, or another error, keep the task ID and explain that the status could not be refreshed. Report the last confirmed status, including “submitted” or “processing” if that was the most recent confirmation. Say “status unconfirmed” only when the task's status has never been confirmed. End the query without resubmitting.

## 5. Normalize results

1. Compare task and work statuses case-insensitively and use the live schema for terminal states.
2. If a work has a `status`, count it only when that status is successful. If absent, use the task's terminal status and the available media. Count only results with usable primary media of the requested type.
3. Prefer `urlWithoutWatermark`, then `url`.
4. Treat `coverUrlWithoutWatermark` and `coverUrl` only as thumbnails. A video cover is not a completed video.
5. Without a widget, report the successful work count and at most one primary link. Never log signed URLs or treat them as permanent asset IDs.

## 6. Handle ambiguity and retries

- With `generationId`, follow the [existing-task flow](#4-keep-one-refresh-owner). Use the mounted widget or query once if the current request calls for it.
- If the submission returns no `generationId` and none is known for that attempt, preserve `taskTraceId`. Report the actual error and any unknown creation or billing state, then stop. Do not call or offer a task query. `query_tasks` requires a task ID and cannot search history or look up a task by trace ID. A query response omitting the ID does not invalidate an already known ID.
- Never replay automatically. Any further submission requires fresh explicit authorization.
- For an explicit retry of the same goal, reuse `taskTraceId`; the new attempt receives a new `generationId`.

Stop after one confirmed generation, one requested query snapshot, delegation to a mounted widget, or an unrecoverable unknown-state report.
