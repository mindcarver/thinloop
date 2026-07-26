export class IssueStore {
  #issues = [];

  add(issue) {
    this.#issues.push(issue);
    return issue;
  }

  get(id) {
    return this.#issues.find((issue) => issue.id === id);
  }

  list() {
    return [...this.#issues];
  }
}
