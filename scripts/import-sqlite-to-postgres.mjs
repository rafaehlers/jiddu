import Database from "better-sqlite3";
import pg from "pg";

const { Client } = pg;

const MARKER_KEY = "migration.sqlite_to_postgres.v1";
const ADVISORY_LOCK_ID = 4_690_214_881;

// Parent tables must precede the three credit-ledger tables that reference an
// account. Every other model is independent in the current Prisma schema.
const TABLES = [
  "Analysis",
  "AppSetting",
  "ApiKey",
  "ProviderCredential",
  "PlatformAccessGrant",
  "JidduCreditAccount",
  "JidduCreditPackage",
  "SlopCheck",
  "Neutrality",
  "Explanation",
  "PaperReview",
  "VerdictFeedback",
  "ClaimVerdict",
  "FactCheck",
  "JidduCreditTransaction",
  "JidduCreditReservation",
  "StripeCreditPurchase",
];

const BOOLEAN_COLUMNS = new Set([
  "JidduCreditPackage.active",
  "StripeCreditPurchase.livemode",
]);

const sqlitePath = process.env.SQLITE_DATABASE_PATH;
const postgresUrl = process.env.DATABASE_URL;

if (!sqlitePath) {
  throw new Error("SQLITE_DATABASE_PATH is required for the one-time import.");
}
if (!postgresUrl?.startsWith("postgresql://") && !postgresUrl?.startsWith("postgres://")) {
  throw new Error("DATABASE_URL must point to PostgreSQL for the SQLite import.");
}

const sqlite = new Database(sqlitePath, {
  readonly: true,
  fileMustExist: true,
});
const postgres = new Client({ connectionString: postgresUrl });

function quoteIdentifier(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`);
  }
  return `"${value}"`;
}

function sourceColumns(table) {
  const columns = sqlite
    .prepare(`PRAGMA table_info(${quoteIdentifier(table)})`)
    .all()
    .map((column) => column.name);
  if (columns.length === 0) {
    throw new Error(`SQLite source table is missing: ${table}`);
  }
  return columns;
}

function postgresValue(table, column, value) {
  if (value === null || value === undefined) return null;
  if (BOOLEAN_COLUMNS.has(`${table}.${column}`)) return Boolean(value);
  return value;
}

async function markerExists() {
  const result = await postgres.query(
    `SELECT 1 FROM "AppSetting" WHERE "key" = $1 LIMIT 1`,
    [MARKER_KEY],
  );
  return result.rowCount === 1;
}

async function assertDestinationIsEmpty() {
  const occupied = [];
  for (const table of TABLES) {
    const result = await postgres.query(
      `SELECT COUNT(*)::int AS count FROM ${quoteIdentifier(table)}`,
    );
    const count = result.rows[0]?.count ?? 0;
    if (count > 0) occupied.push(`${table}=${count}`);
  }
  if (occupied.length > 0) {
    throw new Error(
      `PostgreSQL destination is not empty and has no import marker: ${occupied.join(", ")}`,
    );
  }
}

async function copyTable(table) {
  const columns = sourceColumns(table);
  const quotedTable = quoteIdentifier(table);
  const quotedColumns = columns.map(quoteIdentifier).join(", ");
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  const rows = sqlite.prepare(`SELECT * FROM ${quotedTable}`).all();

  for (const row of rows) {
    const values = columns.map((column) =>
      postgresValue(table, column, row[column]),
    );
    await postgres.query(
      `INSERT INTO ${quotedTable} (${quotedColumns}) VALUES (${placeholders})`,
      values,
    );
  }

  const destination = await postgres.query(
    `SELECT COUNT(*)::int AS count FROM ${quotedTable}`,
  );
  const copied = destination.rows[0]?.count ?? 0;
  if (copied !== rows.length) {
    throw new Error(
      `${table} validation failed: source=${rows.length}, destination=${copied}`,
    );
  }
  return copied;
}

async function main() {
  const integrity = sqlite.pragma("quick_check", { simple: true });
  if (integrity !== "ok") {
    throw new Error(`SQLite quick_check failed: ${String(integrity)}`);
  }

  await postgres.connect();
  await postgres.query("SELECT pg_advisory_lock($1)", [ADVISORY_LOCK_ID]);

  if (await markerExists()) {
    console.log("[jiddu] SQLite data was already imported; skipping.");
    return;
  }

  await assertDestinationIsEmpty();
  await postgres.query("BEGIN");
  try {
    let total = 0;
    for (const table of TABLES) {
      const copied = await copyTable(table);
      total += copied;
      console.log(`[jiddu] imported ${table}: ${copied}`);
    }

    await postgres.query(
      `INSERT INTO "AppSetting" ("key", "value", "updatedAt")
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT ("key") DO UPDATE
       SET "value" = EXCLUDED."value", "updatedAt" = EXCLUDED."updatedAt"`,
      [
        MARKER_KEY,
        JSON.stringify({
          completedAt: new Date().toISOString(),
          source: "sqlite",
          rows: total,
        }),
      ],
    );

    await postgres.query("COMMIT");
    console.log(`[jiddu] SQLite → PostgreSQL import complete: ${total} rows.`);
  } catch (error) {
    await postgres.query("ROLLBACK");
    throw error;
  }
}

try {
  await main();
} finally {
  try {
    await postgres.query("SELECT pg_advisory_unlock($1)", [ADVISORY_LOCK_ID]);
  } catch {
    // The connection may not have been established or may already be closed.
  }
  await postgres.end().catch(() => undefined);
  sqlite.close();
}
