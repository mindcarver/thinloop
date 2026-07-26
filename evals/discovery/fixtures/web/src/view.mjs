export function emptyState() {
  return {
    heading: "暂无任务",
    description: "创建一个任务来开始今天的工作。",
    action: "创建任务",
    analyticsEvent: "empty_state_viewed",
  };
}

export function activeTimer(state) {
  return state.timer ?? null;
}
