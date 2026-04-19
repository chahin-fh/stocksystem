const { getPool } = require("./database/mysql");

async function listFieldsByDatabaseId(databaseId) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, database_id AS databaseId, name, type, required, created_at AS createdAt FROM `fields` WHERE database_id = ? ORDER BY created_at ASC",
    [databaseId]
  );
  return rows.map(r => ({ ...r, required: !!r.required }));
}

async function createField({ id, databaseId, name, type, required }) {
  const pool = getPool();
  await pool.query(
    "INSERT INTO `fields` (id, database_id, name, type, required, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [id, databaseId, name, type, required ? 1 : 0, new Date()]
  );

  const [rows] = await pool.query(
    "SELECT id, database_id AS databaseId, name, type, required, created_at AS createdAt FROM `fields` WHERE id = ? LIMIT 1",
    [id]
  );
  return { ...rows[0], required: !!rows[0].required };
}

async function updateFieldById(id, updates) {
  const pool = getPool();
  const fields = [];
  const values = [];

  if (typeof updates.name === "string") {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (typeof updates.type === "string") {
    fields.push("type = ?");
    values.push(updates.type);
  }
  if (typeof updates.required === "boolean") {
    fields.push("required = ?");
    values.push(updates.required ? 1 : 0);
  }

  if (fields.length === 0) return getFieldById(id);

  fields.push("updated_at = ?");
  values.push(new Date());
  values.push(id);

  await pool.query(`UPDATE \`fields\` SET ${fields.join(", ")} WHERE id = ?`, values);
  return getFieldById(id);
}

async function getFieldById(id) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, database_id AS databaseId, name, type, required, created_at AS createdAt FROM `fields` WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ? { ...rows[0], required: !!rows[0].required } : null;
}

async function deleteFieldById(id) {
  const pool = getPool();
  await pool.query("DELETE FROM `fields` WHERE id = ?", [id]);
  return true;
}

module.exports = {
  listFieldsByDatabaseId,
  createField,
  updateFieldById,
  getFieldById,
  deleteFieldById,
};
