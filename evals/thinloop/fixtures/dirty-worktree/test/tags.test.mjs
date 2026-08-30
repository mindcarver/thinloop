import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTag } from "../src/tags.mjs";

test("tags are normalized", () => {
  assert.equal(normalizeTag("  ThinLoop "), "thinloop");
});
