# Thinloop Delivery Default

After an in-scope Thinloop development change passes its required engineering
verification, do not ask whether to finish delivery. Complete the ordinary
delivery sequence:

1. create or update the governing GitHub Issue;
2. commit only the task-owned changes and push the issue branch;
3. create a pull request with acceptance evidence and wait for required checks;
4. audit the complete Issue, including acceptance evidence, task disposition,
   exact diff, and delivery state; for page changes, require real browser
   interaction and visual evidence rather than API or build-only proof;
5. delegate acceptance to a separate fresh-context verification subagent that
   returns `PASS`, `FAIL`, or `BLOCKED` with direct evidence, then merge only
   after `PASS`;
6. synchronize local `main` and confirm it contains the accepted change;
7. only when the merged change modifies installed Thinloop payload or runtime
   behavior—such as `skills/**`, `hooks/**`, plugin manifests, version metadata,
   or installation mechanics—reinstall or refresh the affected supported local
   agents, then verify the installed version, skill names, and hooks that each
   platform supports;
8. do not refresh local agents for repository-only changes such as `README.md`,
   `docs/**`, tests, evaluations, CI configuration, or assets that installed
   Skills and plugins do not load;
9. close the Issue only after the merged version, required installation state,
   and all three completion-audit ledgers still support `PASS`.

This standing instruction authorizes ordinary task-local GitHub writes,
task-branch cleanup, and local Thinloop reinstall work. It does not authorize
unrelated changes, weakening repository protections, production deployment,
live destructive migration, authentication or authorization changes, payments,
secrets, privacy or compliance changes, or another irreversible high-risk
action. Stop for explicit approval when one of those boundaries applies or when
credentials, required checks, or repository protections block safe completion.
