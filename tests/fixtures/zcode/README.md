# ZCode plugin-list compatibility fixtures

These are representative, sanitized fixtures, not captured private CLI output.
`array.json` models the top-level list reported in Thinloop issue #104:
https://github.com/mindcarver/thinloop/issues/104
`envelope.json` preserves the previously supported `{ plugins, diagnostics }`
shape. Both retain the installation fields checked by Thinloop; paths/version
are substituted at test time. An unrelated plugin is included to exercise
selection rather than treating the first list entry as Thinloop.
