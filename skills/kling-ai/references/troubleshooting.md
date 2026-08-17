# Troubleshooting

## MCP tools are missing after installation

Reload the host's plugins/extensions and confirm that the `Plugin-OpenClaw-kling-ai` MCP
server is enabled. If the tools still do not appear, restart the host and
check its MCP diagnostics. Do not ask for an API key as a workaround.

## Not authorized or not linked

Open the host's MCP/plugin connection panel, select `Plugin-OpenClaw-kling-ai`, and complete
the browser OAuth flow. Claude Code-compatible hosts may show the connection
under `/mcp`, the plugin details page, or the host's MCP settings. If OAuth
returns `invalid_target`, do not add an explicit `oauth_resource` override;
Kling publishes protected-resource metadata and the host should discover it.

## Upload or image-to-video fails

- Confirm `file_upload` returned a Kling URL.
- Reuse the same UUID v7 `taskTraceId` for upload and generation.
- Use the input name declared by the selected live model, commonly
  `first_image` for one first frame.
- Keep every `arguments[].value` a string.

## Task is still running

Ask the Agent to query the task once with its `generationId`. Do not poll in a
loop; the task keeps running on Kling's side even after the host session ends.

## Generation fails

Return the provider's failure message and preserve the IDs for support. Do
not automatically create a replacement task because that may consume credits
again.

## Submission timed out and billing is unknown

Do not retry the generation call. First query existing tasks using the
available `taskTraceId`, `generationId`, or provider task-list filters. If the
provider cannot prove whether a task was created, tell the user the billing
state is unknown and request a deliberate decision before any new submission.

## Result link expired

Signed output URLs may be temporary. Query the preserved `generationId` again
to obtain current outputs. Do not log or treat a signed URL as a permanent
asset identifier.
