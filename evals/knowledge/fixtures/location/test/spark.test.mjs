import assert from "node:assert/strict";
import test from "node:test";
import { runSpark } from "../src/commands/spark.mjs";

test("Spark returns a startup result", () => {
  assert.equal(typeof runSpark(), "string");
});
