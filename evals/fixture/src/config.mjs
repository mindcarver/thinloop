const defaults = Object.freeze({
  pageSize: 20,
  theme: "light",
});

export function getConfig(overrides = {}) {
  return { ...defaults, ...overrides };
}
