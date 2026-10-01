import fs from "node:fs";
import path from "node:path";

export function zcodeFixture(shape, { installPath, version, sourceRoot }) {
  return JSON.parse(fs.readFileSync(new URL(`../fixtures/zcode/${shape}.json`, import.meta.url), "utf8"), (key, value) => {
    if (value === "$VERSION") return version;
    if (value === "$SOURCE_ROOT") return sourceRoot;
    if (value === "$INSTALL_ROOT") return installPath;
    if (typeof value === "string" && value.startsWith("$INSTALL_ROOT/")) {
      return path.join(installPath, ...value.slice("$INSTALL_ROOT/".length).split("/"));
    }
    return value;
  });
}
