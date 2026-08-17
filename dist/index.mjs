import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import {
  updateAuthProfileStoreWithLock,
  writeOAuthCredentials
} from "openclaw/plugin-sdk/provider-auth";
import {
  createKlingLoginCommandHandler,
  createKlingLogoutCommandHandler,
  createKlingStatusCommandHandler,
  createKlingUseCommandHandler
} from "./cli-login.mjs";
import {
  KLING_OAUTH_PROFILE_IDS,
  KLING_OAUTH_PROVIDER_ID,
  refreshKlingOAuthCredential
} from "./kling-oauth-client.mjs";
import { normalizeKlingResultMedia } from "./result-media.mjs";

async function saveKlingCredentials({ region, credentials }) {
  return writeOAuthCredentials(KLING_OAUTH_PROVIDER_ID, credentials, undefined, {
    profileName: region,
    displayName: region === "global" ? "Kling AI International" : "Kling AI China"
  });
}

async function removeKlingCredentials({ region }) {
  const profileId = KLING_OAUTH_PROFILE_IDS[region];
  await updateAuthProfileStoreWithLock({
    updater(store) {
      if (!store.profiles[profileId]) return false;
      delete store.profiles[profileId];
      for (const [provider, order] of Object.entries(store.order ?? {})) {
        const next = order.filter((candidate) => candidate !== profileId);
        if (next.length > 0) store.order[provider] = next;
        else delete store.order[provider];
      }
      for (const [provider, lastGood] of Object.entries(store.lastGood ?? {})) {
        if (lastGood === profileId) delete store.lastGood[provider];
      }
      if (store.usageStats) delete store.usageStats[profileId];
      return true;
    }
  });
}

// OpenClaw owns MCP transport, credential storage, refresh locking, and skill loading.
export default definePluginEntry({
  id: "kling-ai",
  name: "Kling AI",
  description: "Build your own AI creative workflow with Kling MCP",
  register(api) {
    api.registerProvider({
      id: KLING_OAUTH_PROVIDER_ID,
      label: "Kling AI MCP OAuth",
      auth: [],
      refreshOAuth: refreshKlingOAuthCredential,
      buildAuthDoctorHint: () => "Run openclaw kling-ai login --region global or --region cn."
    });

    api.on("reply_dispatch", (_event, context) => {
      context.dispatcher.appendBeforeDeliver?.((payload) => normalizeKlingResultMedia(payload));
    });

    api.on("reply_payload_sending", (event) => ({
      payload: normalizeKlingResultMedia(event.payload)
    }));

    api.registerCli(({ program }) => {
      const handleKlingLoginCommand = createKlingLoginCommandHandler(undefined, {
        saveCredentials: saveKlingCredentials
      });
      const handleKlingStatusCommand = createKlingStatusCommandHandler();
      const handleKlingLogoutCommand = createKlingLogoutCommandHandler(undefined, {
        removeCredentials: removeKlingCredentials
      });
      const handleKlingUseCommand = createKlingUseCommandHandler(undefined, {
        removeCredentials: removeKlingCredentials
      });
      const kling = program.command("kling-ai").description("Kling AI plugin commands");
      kling.command("login")
        .description("Authorize Kling AI and open the current OAuth page")
        .option("--region <region>", "Account site: global for https://kling.ai/, cn for https://klingai.com/app")
        .action(handleKlingLoginCommand);
      kling.command("status")
        .description("Show the configured Kling AI region and authorization state")
        .option("--region <region>", "Account site to show: global, cn, or all", "all")
        .action(handleKlingStatusCommand);
      kling.command("logout")
        .description("Clear authorization for the active Kling AI region")
        .requiredOption("--region <region>", "Account site: global for https://kling.ai/, cn for https://klingai.com/app")
        .action(handleKlingLogoutCommand);
      kling.command("use")
        .description("Switch the active Kling AI region without starting login")
        .requiredOption("--region <region>", "Account site: global for https://kling.ai/, cn for https://klingai.com/app")
        .action(handleKlingUseCommand);
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
