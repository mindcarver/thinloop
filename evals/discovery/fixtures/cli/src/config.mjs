export function listLimit(explicitLimit) {
  return explicitLimit ?? 20;
}

export function exportFields(task) {
  return {
    id: task.id,
    title: task.title,
    completed: Boolean(task.completed),
  };
}
