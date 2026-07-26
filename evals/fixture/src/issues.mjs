let nextId = 1;

export function createIssue(input) {
  const tags = [...new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
  return {
    id: nextId++,
    title: input.title.trim(),
    priority: input.priority ?? "normal",
    tags,
  };
}

export function findIssue(issues, id) {
  return issues.find((issue) => issue.id === id);
}

export function resetIssueIds() {
  nextId = 1;
}
