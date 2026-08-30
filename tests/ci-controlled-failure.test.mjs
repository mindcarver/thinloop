import assert from "node:assert/strict";
import test from "node:test";

test("Issue #76 controlled CI failure probe", () => {
  assert.fail("intentional failure: verify Thinloop CI propagates test failures");
});
