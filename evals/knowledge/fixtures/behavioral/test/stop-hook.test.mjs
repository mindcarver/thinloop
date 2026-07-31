import assert from "node:assert/strict";
import test from "node:test";
import { stopHook } from "../src/stop-hook.mjs";

test("stopHook reports and returns the terminal state", async () => {
  let reported = false;
  const result = await stopHook(async () => {
    reported = true;
  });
  assert.equal(reported, true);
  assert.equal(result, "stopped");
});
