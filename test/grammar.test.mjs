import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { grammar } from "../src/grammar.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("correctly parses full valid recipe", async () => {
  const file = await readFile(path.join(__dirname, "recipe.txt"));

  const match = grammar.match(file.toString());

  if (!match.succeeded()) {
    assert.fail(match.message);
  }
});

test("temperature without number", () => {
  const match = grammar.match("temperature");

  assert.equal(
    match.message,
    `Line 1, col 12:\n> 1 | temperature\n                 ^\nExpected " "`,
  );
});
