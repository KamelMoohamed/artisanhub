#!/usr/bin/env node
/**
 * Shim for the abandoned `graphql-code-generator` (v0.17.0) package that the
 * Shopify CLI hard-codes in its function scaffolding ("npm exec --
 * graphql-code-generator --config package.json").
 *
 * Behaviour:
 *   1. Look for a `codegen` block in the cwd's package.json.
 *   2. If present, delegate to the modern `@graphql-codegen/cli` (which reads
 *      `package.json#codegen` via cosmiconfig).
 *   3. If absent, exit 0 quietly so the scaffold doesn't fail.
 */

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const cwd = process.cwd();
const pkgPath = resolve(cwd, "package.json");

if (!existsSync(pkgPath)) process.exit(0);

let pkg;
try {
  pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
} catch {
  process.exit(0);
}

if (!pkg.codegen) process.exit(0);

const require = createRequire(import.meta.url);
let codegenBin;
try {
  codegenBin = require.resolve("@graphql-codegen/cli/cjs/bin.js");
} catch {
  console.error(
    "[graphql-code-generator stub] @graphql-codegen/cli is not installed; cannot generate types."
  );
  process.exit(1);
}

const result = spawnSync(process.execPath, [codegenBin], {
  cwd,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
