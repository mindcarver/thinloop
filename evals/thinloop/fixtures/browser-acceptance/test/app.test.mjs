import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { savedMessage } from "../public/app.mjs";

test("save source updates the visible status", () => {
  const source = fs.readFileSync(new URL("../public/app.mjs", import.meta.url), "utf8");
  assert.equal(savedMessage("Ada"), "Saved Ada");
  assert.match(source, /#status/);
});
