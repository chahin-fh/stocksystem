const { getPool } = require("./database/mysql");

async function listActivitiesByDatabaseId(databaseId) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, database_id AS databaseId, action, created_at AS createdAt FROM `activities` WHERE database_id = ? ORDER BY created_at DESC LIMIT 50",
    [databaseId]
  );
  return rows;
}

async function createActivity({ id, databaseId, action }) {
  const pool = getPool();
  await pool.query(
    "INSERT INTO `activities` (id, database_id, action, created_at) VALUES (?, ?, ?, ?)",
    [id, databaseId, action, new Date()]
  );

  const [rows] = await pool.query(
    "SELECT id, database_id AS databaseId, action, created_at AS createdAt FROM `activities` WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0];
}

module.exports = {
  listActivitiesByDatabaseId,
  createActivity,
};
