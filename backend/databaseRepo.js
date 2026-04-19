const { getPool } = require("./database/mysql");

async function listDatabasesByCreatorId(creatorId) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, name, description, field_count AS fieldCount, created_at AS createdAt FROM `databases` WHERE creator_id = ? ORDER BY created_at DESC",
    [creatorId]
  );
  return rows;
}

async function getFirstDatabaseByCreatorId(creatorId) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, name, description, field_count AS fieldCount, created_at AS createdAt FROM `databases` WHERE creator_id = ? ORDER BY created_at DESC LIMIT 1",
    [creatorId]
  );
  return rows[0] || null;
}

async function createDatabase({ id, creatorId, name, description }) {
  const pool = getPool();
  await pool.query(
    "INSERT INTO `databases` (id, creator_id, name, description, field_count, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [id, creatorId, name, description || null, 0, new Date()]
  );

  const [rows] = await pool.query(
    "SELECT id, name, description, field_count AS fieldCount, created_at AS createdAt FROM `databases` WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0];
}

async function updateDatabaseByIdAndCreatorId({ id, creatorId, updates }) {
  const pool = getPool();

  const fields = [];
  const values = [];

  if (typeof updates.name === "string") {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (typeof updates.description === "string") {
    fields.push("description = ?");
    values.push(updates.description);
  }

  if (fields.length === 0) {
    return getDatabaseByIdAndCreatorId(id, creatorId);
  }

  fields.push("updated_at = ?");
  values.push(new Date());

  values.push(id, creatorId);

  await pool.query(
    `UPDATE \`databases\` SET ${fields.join(", ")} WHERE id = ? AND creator_id = ?`,
    values
  );

  return getDatabaseByIdAndCreatorId(id, creatorId);
}

async function getDatabaseByIdAndCreatorId(id, creatorId) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, name, description, field_count AS fieldCount, created_at AS createdAt FROM `databases` WHERE id = ? AND creator_id = ? LIMIT 1",
    [id, creatorId]
  );
  return rows[0] || null;
}

module.exports = {
  listDatabasesByCreatorId,
  getFirstDatabaseByCreatorId,
  createDatabase,
  updateDatabaseByIdAndCreatorId,
  getDatabaseByIdAndCreatorId,
};
