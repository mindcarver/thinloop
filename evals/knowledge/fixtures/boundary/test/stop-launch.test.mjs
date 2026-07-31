import assert from "node:assert/strict";
import test from "node:test";
import { launchReporter, targetPlatform } from "../src/stop-launch.mjs";

test("the fixture targets Linux", () => {
  assert.equal(targetPlatform, "linux");
  assert.deepEqual(launchReporter(), {
    mode: "in-process",
    platform: "linux",
  });
});
