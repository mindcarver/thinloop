import assert from "node:assert/strict";
import test from "node:test";
import { exportData } from "../src/export.mjs";

test("existing export behavior remains stable", () => {
  assert.deepEqual(exportData([{ id: 1 }]), [{ id: 1 }]);
});
