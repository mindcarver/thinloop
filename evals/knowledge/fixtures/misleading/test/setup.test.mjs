import assert from "node:assert/strict";
import test from "node:test";
import { setupList } from "../src/setup.mjs";

test("the verified RecyclerView setup works", () => {
  assert.equal(setupList(), "recycler");
});
