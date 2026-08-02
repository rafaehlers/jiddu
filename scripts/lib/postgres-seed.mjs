import pg from "pg";

const { Client } = pg;

/**
 * Tiny compatibility layer for the curated demo scripts. It keeps their
 * compact prepare/run shape while writing idempotently to PostgreSQL.
 */
export function createSeedDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (
    !connectionString?.startsWith("postgresql://") &&
    !connectionString?.startsWith("postgres://")
  ) {
    throw new Error("DATABASE_URL must point to PostgreSQL to seed demos.");
  }

  const queued = [];

  return {
    prepare(sourceSql) {
      const statement = buildPostgresUpsert(sourceSql);
      return {
        run(...values) {
          queued.push({ statement, values });
        },
      };
    },

    async close() {
      const client = new Client({ connectionString });
      await client.connect();
      await client.query("BEGIN");
      try {
        for (const { statement, values } of queued) {
          await client.query(statement, values);
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        await client.end();
      }
    },
  };
}

export function buildPostgresUpsert(sourceSql) {
  const match = sourceSql.match(
    /INSERT\s+OR\s+REPLACE\s+INTO\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/is,
  );
  if (!match) throw new Error("Unsupported demo seed statement.");

  const table = quoteIdentifier(match[1]);
  const columns = match[2]
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
  if (columns[0] !== "id") {
    throw new Error("Demo seed statements must use id as their first column.");
  }

  const quotedColumns = columns.map(quoteIdentifier);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  const assignments = quotedColumns
    .slice(1)
    .map((column) => `${column} = EXCLUDED.${column}`);

  return `INSERT INTO ${table} (${quotedColumns.join(", ")})
    VALUES (${placeholders.join(", ")})
    ON CONFLICT ("id") DO UPDATE SET ${assignments.join(", ")}`;
}

function quoteIdentifier(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`);
  }
  return `"${value}"`;
}
