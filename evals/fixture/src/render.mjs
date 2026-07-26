export function renderIssueRow(issue) {
  return `<li class="issue issue--${issue.priority}">${issue.title}</li>`;
}
