import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createResultId,
  reserveResultIdWith,
  RESULT_ID_LENGTH,
} from "./result-id";

const RESULT_CREATORS = [
  "src/app/api/analyze/route.ts",
  "src/app/api/factcheck/route.ts",
  "src/app/api/neutrality/route.ts",
  "src/app/api/explain/route.ts",
  "src/app/api/slop/route.ts",
  "src/app/api/live/analyze/route.ts",
  "src/lib/api/analysis-history.ts",
  "src/lib/paper-review-job.ts",
  "scripts/smoke-openrouter-postgres.mts",
] as const;

test("result IDs contain exactly five alphanumeric characters", () => {
  for (let index = 0; index < 100; index += 1) {
    const id = createResultId();
    assert.equal(id.length, RESULT_ID_LENGTH);
    assert.match(id, /^[0-9A-Za-z]{5}$/);
    assert.doesNotMatch(id, /[0OIl]/);
  }
});

test("result ID reservation retries a collision", async () => {
  const candidates = ["AAAAA", "B2c3D"];
  const attempted: string[] = [];

  const id = await reserveResultIdWith(
    async (candidate) => {
      attempted.push(candidate);
      if (candidate === "AAAAA") throw { code: "P2002" };
    },
    () => candidates.shift() ?? "unused",
  );

  assert.equal(id, "B2c3D");
  assert.deepEqual(attempted, ["AAAAA", "B2c3D"]);
});

test("result ID reservation preserves non-collision failures", async () => {
  const failure = new Error("database unavailable");

  await assert.rejects(
    reserveResultIdWith(async () => {
      throw failure;
    }),
    (error) => error === failure,
  );
});

test("every result creator reserves a short ID", async () => {
  for (const path of RESULT_CREATORS) {
    const source = await readFile(path, "utf8");
    assert.match(source, /reserveResultId\(/, path);
    assert.doesNotMatch(source, /nanoid\(10\)/, path);
  }
});
