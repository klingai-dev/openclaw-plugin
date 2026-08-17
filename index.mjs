import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { handleKlingLoginCommand } from "./cli-login.mjs";
import { normalizeKlingResultMedia } from "./result-media.mjs";

// OpenClaw owns MCP transport, OAuth storage, token refresh, and skill loading.
export default definePluginEntry({
  id: "kling-ai",
  name: "Kling AI",
  description: "Build your own AI creative workflow with Kling MCP",
  register(api) {
    api.on("reply_dispatch", (_event, context) => {
      context.dispatcher.appendBeforeDeliver?.((payload) => normalizeKlingResultMedia(payload));
    });

    api.on("reply_payload_sending", (event) => ({
      payload: normalizeKlingResultMedia(event.payload)
    }));

    api.registerCli(({ program }) => {
      const kling = program.command("kling-ai").description("Kling AI plugin commands");
      kling.command("login")
        .description("Authorize Kling AI and open the current OAuth page")
        .option("--region <region>", "Kling service region: cn or global")
        .action(handleKlingLoginCommand);
    }, {
      commands: ["kling-ai"],
      descriptors: [{
        name: "kling-ai",
        description: "Kling AI plugin commands",
        hasSubcommands: true
      }]
    });
  }
});
