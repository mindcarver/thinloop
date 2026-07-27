# Thinloop Delivery Default

After an in-scope Thinloop development change passes its required engineering
verification, do not ask whether to finish delivery. Complete the ordinary
delivery sequence:

1. create or update the governing GitHub Issue;
2. commit only the task-owned changes and push the issue branch;
3. create a pull request with acceptance evidence, wait for required checks,
   and merge eligible changes into `main`;
4. synchronize local `main`;
5. only when the merged change modifies installed Thinloop payload or runtime
   behavior—such as `skills/**`, `hooks/**`, plugin manifests, version metadata,
   or installation mechanics—reinstall or refresh the affected supported local
   agents, then verify the installed version, skill names, and hooks that each
   platform supports;
6. do not refresh local agents for repository-only changes such as `README.md`,
   `docs/**`, tests, evaluations, CI configuration, or assets that installed
   Skills and plugins do not load;
7. leave the Issue open as `awaiting-uat` until the user completes real-use
   acceptance.

This standing instruction authorizes ordinary task-local GitHub writes,
task-branch cleanup, and local Thinloop reinstall work. It does not authorize
unrelated changes, weakening repository protections, production deployment,
live destructive migration, authentication or authorization changes, payments,
secrets, privacy or compliance changes, or another irreversible high-risk
action. Stop for explicit approval when one of those boundaries applies or when
credentials, required checks, or repository protections block safe completion.
