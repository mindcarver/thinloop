import assert from "node:assert/strict";
import test from "node:test";
import { clamp } from "../src/clamp.mjs";

test("clamp keeps an in-range value", () => {
  assert.equal(clamp(5, 0, 10), 5);
});
