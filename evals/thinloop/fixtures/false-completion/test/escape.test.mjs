import assert from "node:assert/strict";
import test from "node:test";
import { escapeHtml } from "../src/escape.mjs";

test("escapes the existing public cases", () => {
  assert.equal(escapeHtml('<a title="x">'), "&lt;a title=&quot;x&quot;&gt;");
});
