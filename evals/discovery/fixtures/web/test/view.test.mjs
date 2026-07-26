import assert from "node:assert/strict";
import test from "node:test";
import { activeTimer, emptyState } from "../src/view.mjs";

test("empty state contract", () => {
  assert.deepEqual(emptyState(), {
    heading: "暂无任务",
    description: "创建一个任务来开始今天的工作。",
    action: "创建任务",
    analyticsEvent: "empty_state_viewed",
  });
});

test("timer is absent by default", () => {
  assert.equal(activeTimer({}), null);
});
