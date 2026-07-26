import assert from "node:assert/strict";
import test from "node:test";
import { exportFields, listLimit } from "../src/config.mjs";

test("list limit defaults to twenty", () => {
  assert.equal(listLimit(), 20);
  assert.equal(listLimit(7), 7);
});

test("public export fields exclude internal timestamps", () => {
  assert.deepEqual(
    exportFields({ id: 1, title: "A", completed: false, updatedAt: 99 }),
    { id: 1, title: "A", completed: false },
  );
});
