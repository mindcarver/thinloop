import assert from "node:assert/strict";
import test from "node:test";
import { envelope, pageLimit } from "../src/records.mjs";

test("page limit contract", () => {
  assert.equal(pageLimit(), 20);
  assert.equal(pageLimit(7), 7);
  assert.equal(pageLimit(500), 100);
});

test("response envelope remains stable", () => {
  assert.deepEqual(envelope([{ id: 1 }]), {
    items: [{ id: 1 }],
    nextCursor: null,
  });
});
