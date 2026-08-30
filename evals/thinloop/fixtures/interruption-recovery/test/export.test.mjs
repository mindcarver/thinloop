import assert from "node:assert/strict";
import test from "node:test";
import { exportCsv } from "../src/export.mjs";

test("CSV export uses the recorded column order", () => {
  assert.equal(exportCsv([{ id: 1, name: "Ada" }]), "id,name\n1,Ada");
});
