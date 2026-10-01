// A deliberately bounded, dependency-free reader for the documented DSH patch
// format. It is NOT a general YAML parser. Unsupported syntax fails closed so
// comments, aliases, tags, folded strings or malformed YAML cannot prove a mount.
export function readDshPatch(text) {
  const fail = () => { throw new Error("unsupported or malformed patch YAML; verify with dsh --dump-config"); };
  const lines = [];
  let ended = false;
  let started = false;
  for (const raw of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    if (/[\t\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\ufffe\uffff]/.test(raw)) fail();
    let quote = null;
    let end = raw.length;
    for (let i = 0; i < raw.length; i++) {
      const char = raw[i];
      if (quote === '"' && char === "\\") { i++; continue; }
      if (quote === "'" && char === "'" && raw[i + 1] === "'") { i++; continue; }
      if (quote) { if (char === quote) quote = null; }
      else if (char === '"' || char === "'") quote = char;
      else if (char === "#" && (i === 0 || raw[i - 1] === " ")) { end = i; break; }
    }
    if (quote) fail();
    const line = raw.slice(0, end).replace(/ +$/, "");
    if (!line) continue;
    if (ended) fail();
    if (line === "---" && lines.length === 0 && !started) { started = true; continue; }
    if (line === "...") { ended = true; continue; }
    const indent = /^ */.exec(line)[0].length;
    lines.push({ indent, text: line.slice(indent) });
  }
  if (lines.length === 0) fail();
  if (lines.length === 1 && lines[0].text === "[]") return [];
  let index = 0;
  const scalar = value => {
    if (value === "[]") return [];
    if (value === "{}") return {};
    if (["null", "Null", "NULL", "~"].includes(value)) return null;
    if (/^(true|True|TRUE|false|False|FALSE)$/.test(value)) return value.toLowerCase() === "true";
    if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(value)) return Number(value);
    if (value.startsWith('"')) {
      try { return JSON.parse(value); } catch { fail(); }
    }
    if (value.startsWith("'")) {
      if (!/^'(?:[^']|'')*'$/.test(value)) fail();
      return value.slice(1, -1).replaceAll("''", "'");
    }
    if (!value || /^[?:,\-\[\]{}#&*!|>'"%@`]/.test(value) ||
        /[\[\]{}]|:(?:\s|$)|\s[&*!|>]/.test(value)) fail();
    return value;
  };
  function pair(text, indent, target) {
    const match = /^([A-Za-z_][\w-]*):(?: +(.*))?$/.exec(text);
    if (!match || ["__proto__", "constructor", "prototype", "__jsExpr"].includes(match[1]) || Object.hasOwn(target, match[1])) fail();
    const [, key, value] = match;
    target[key] = value !== undefined ? scalar(value) :
      lines[index]?.indent > indent ? block(lines[index].indent) : null;
  }
  function mapping(indent, first) {
    const result = {};
    if (first !== undefined) pair(first, indent, result);
    while (index < lines.length && lines[index].indent === indent &&
           !/^-(?: |$)/.test(lines[index].text)) {
      pair(lines[index++].text, indent, result);
    }
    return result;
  }
  function block(indent) {
    if (!/^-(?: |$)/.test(lines[index].text)) return mapping(indent);
    const result = [];
    while (index < lines.length && lines[index].indent === indent &&
           /^-(?: |$)/.test(lines[index].text)) {
      const text = lines[index++].text;
      if (text !== "-" && !/^- [^ ]/.test(text)) fail();
      const value = text.slice(1).replace(/^ +/, "");
      if (!value) result.push(lines[index]?.indent > indent ? block(lines[index].indent) : null);
      else if (/^[A-Za-z_][\w-]*:(?: |$)/.test(value)) result.push(mapping(indent + 2, value));
      else result.push(scalar(value));
    }
    return result;
  }
  const result = block(lines[0].indent);
  if (index !== lines.length || !Array.isArray(result)) fail();
  return result;
}

const object = value => value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Recognize unconditional root insertions only. This does not implement Cordis
 * composition. Overrides, nested groups, conditional fields and duplicate ids
 * require a real composition dump, even if another line names the right handler.
 * Passing all applicable profile/home layers makes overrides fail closed too.
 */
export function hasDshInsertion(layers, rowId, handlerNames) {
  const ids = new Set();
  let found = false;
  for (const patches of layers) {
    for (const patch of patches) {
      if (!object(patch) || Object.keys(patch).length !== 1 ||
          !Array.isArray(patch.insert)) return false;
      for (const entry of patch.insert) {
        if (!object(entry) || typeof entry.id !== "string" || !entry.id ||
            typeof entry.name !== "string" || !entry.name || ids.has(entry.id) ||
            entry.group || Object.keys(entry).some(key =>
              !["id", "name", "disabled", "group", "config"].includes(key))) return false;
        ids.add(entry.id);
        if (entry.id === rowId && handlerNames.includes(entry.name) && !entry.disabled) found = true;
      }
    }
  }
  return found;
}
