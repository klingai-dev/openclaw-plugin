import assert from "node:assert/strict";
import test from "node:test";
import { createKlingLoginCommandHandler } from "../dist/cli-login.mjs";

test("accepts the options object passed by the CLI action", async () => {
  let receivedOptions;
  const handler = createKlingLoginCommandHandler(async (options) => {
    receivedOptions = options;
    return 0;
  });
  const result = await handler({ region: "global" }, { opts: () => ({ region: "cn" }) });

  assert.equal(result, 0);
  assert.deepEqual(receivedOptions, { region: "global" });
});
