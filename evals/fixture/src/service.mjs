import { createIssue } from "./issues.mjs";

export class IssueService {
  constructor(store) {
    this.store = store;
  }

  create(input) {
    return this.store.add(createIssue(input));
  }

  get(id) {
    return this.store.get(id);
  }

  listIssues() {
    return this.store.list();
  }
}
