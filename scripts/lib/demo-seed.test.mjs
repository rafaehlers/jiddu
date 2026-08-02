import assert from "node:assert/strict";
import test from "node:test";
import { structureDemoDocument } from "./demo-document.mjs";
import { buildPostgresUpsert } from "./postgres-seed.mjs";

test("structured demos persist section metadata with exact sentence offsets", () => {
  const result = structureDemoDocument(
    [
      { id: "old-1", text: "First sentence." },
      { id: "old-2", text: "Second sentence." },
      { id: "old-3", text: "Third sentence." },
      { id: "old-4", text: "Fourth sentence." },
    ],
    ["1 Context", "2 Conclusion"],
  );

  assert.equal(result.blocks.length, 2);
  assert.deepEqual(
    result.blocks.map((block) => block.section),
    ["1 Context", "2 Conclusion"],
  );
  assert.equal(result.sentences.length, 4);
  for (const sentence of result.sentences) {
    assert.equal(result.text.slice(sentence.start, sentence.end), sentence.text);
  }
});

test("demo seed statements become idempotent PostgreSQL upserts", () => {
  const sql = buildPostgresUpsert(`
    INSERT OR REPLACE INTO Analysis (id, status, blocks)
    VALUES (?, ?, ?)
  `);

  assert.match(sql, /INSERT INTO "Analysis"/);
  assert.match(sql, /VALUES \(\$1, \$2, \$3\)/);
  assert.match(sql, /ON CONFLICT \("id"\) DO UPDATE/);
  assert.match(sql, /"blocks" = EXCLUDED\."blocks"/);
});
