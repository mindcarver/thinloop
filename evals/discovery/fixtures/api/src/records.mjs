export function pageLimit(value) {
  if (value === undefined) return 20;
  return Math.min(Number(value), 100);
}

export function envelope(items, nextCursor = null) {
  return { items, nextCursor };
}
