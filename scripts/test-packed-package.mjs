import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixtureDir = join(root, "test", "package-consumer");
const temporaryDirectory = mkdtempSync(join(tmpdir(), "equation-connect-"));
const packDirectory = join(temporaryDirectory, "pack");
const consumerDirectory = join(temporaryDirectory, "consumer");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const yarn = process.platform === "win32" ? "yarn.cmd" : "yarn";

const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed`);
};

try {
  mkdirSync(packDirectory);
  mkdirSync(consumerDirectory);

  rmSync(join(root, "dist"), { force: true, recursive: true });
  run(yarn, ["build"], root);
  run(npm, ["pack", "--pack-destination", packDirectory], root);

  const tarballs = readdirSync(packDirectory).filter((file) =>
    file.endsWith(".tgz"),
  );
  assert.equal(
    tarballs.length,
    1,
    "npm pack should create exactly one tarball",
  );

  writeFileSync(
    join(consumerDirectory, "package.json"),
    JSON.stringify({ private: true }, null, 2),
  );
  cpSync(fixtureDir, consumerDirectory, { recursive: true });

  const tarball = join(packDirectory, tarballs[0]);
  run(
    npm,
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
      tarball,
    ],
    consumerDirectory,
  );

  run(process.execPath, ["runtime.cjs"], consumerDirectory);
  run(
    process.execPath,
    [
      join(root, "node_modules", "typescript", "bin", "tsc"),
      "--project",
      "tsconfig.json",
    ],
    consumerDirectory,
  );

  const executable = join(
    consumerDirectory,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "equation-connect.cmd" : "equation-connect",
  );
  run(executable, ["--help"], consumerDirectory);
} finally {
  rmSync(temporaryDirectory, { force: true, recursive: true });
}
