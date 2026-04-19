const fs = require("fs");
const path = require("path");

const mysql = require("mysql2/promise");

try {
  require("dotenv").config();
} catch {}

const { getMysqlConfig, getPool } = require("./database/mysql");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

function splitSqlStatements(sql) {
  return sql
    .replace(/^\uFEFF/, "")
    .split(/;\s*\n/)
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0)
    .map((stmt) => (stmt.endsWith(";") ? stmt : `${stmt};`));
}

async function ensureDatabaseExists() {
  const config = getMysqlConfig();
  const dbName = config.database;
  const { database, ...serverConfig } = config;

  const conn = await mysql.createConnection(serverConfig);
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  } finally {
    await conn.end();
  }
}

async function ensureMigrationsTable(conn) {
  await conn.query(
    "CREATE TABLE IF NOT EXISTS migrations (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, filename VARCHAR(255) NOT NULL, applied_at DATETIME(3) NOT NULL, PRIMARY KEY (id), UNIQUE KEY uq_migrations_filename (filename)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
  );
}

async function getAppliedMigrations(conn) {
  await ensureMigrationsTable(conn);
  const [rows] = await conn.query("SELECT filename FROM migrations ORDER BY id ASC");
  return new Set(rows.map((r) => r.filename));
}

async function applyMigration(conn, filename, sql) {
  await conn.beginTransaction();
  try {
    const statements = splitSqlStatements(sql);
    for (const statement of statements) {
      await conn.query(statement);
    }
    await conn.query("INSERT INTO migrations (filename, applied_at) VALUES (?, ?)", [
      filename,
      new Date(),
    ]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  }
}

async function run() {
  await ensureDatabaseExists();
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    const applied = await getAppliedMigrations(conn);

    for (const file of files) {
      if (applied.has(file)) continue;

      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, "utf8");

      await applyMigration(conn, file, sql);
      process.stdout.write(`Applied migration: ${file}\n`);
    }

    process.stdout.write("Migrations complete.\n");
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
