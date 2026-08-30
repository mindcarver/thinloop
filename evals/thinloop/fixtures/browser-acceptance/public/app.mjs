export function savedMessage(name) {
  return `Saved ${name}`;
}

if (typeof document !== "undefined") {
  document.querySelector("#profile-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}
