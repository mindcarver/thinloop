import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("release flags retain both known keys", () => {
  const flags = JSON.parse(
    fs.readFileSync(new URL("../src/release-flags.json", import.meta.url)),
  );
  assert.equal(typeof flags.rehearsalTransport, "boolean");
  assert.equal(typeof flags.stableTransport, "boolean");
});
