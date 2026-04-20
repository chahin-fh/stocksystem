const { getPool } = require("./database/mysql");

async function listRecordsByDatabaseId(databaseId) {
  const pool = getPool();
  // Fetch records
  const [recordRows] = await pool.query(
    "SELECT id, database_id AS databaseId, created_at AS createdAt FROM `records` WHERE database_id = ? ORDER BY created_at DESC",
    [databaseId]
  );

  if (recordRows.length === 0) return [];

  // Fetch all values for these records
  const recordIds = recordRows.map(r => r.id);
  const [valueRows] = await pool.query(
    "SELECT rv.record_id, rv.field_id, rv.value_text, rv.value_bool, f.type " +
    "FROM `record_values` rv " +
    "JOIN `fields` f ON rv.field_id = f.id " +
    "WHERE rv.record_id IN (?)",
    [recordIds]
  );

  // Group values by record_id
  const valuesByRecord = {};
  valueRows.forEach(row => {
    if (!valuesByRecord[row.record_id]) valuesByRecord[row.record_id] = {};
    
    let val;
    if (row.type === 'boolean') {
      val = !!row.value_bool;
    } else {
      val = row.value_text;
    }
    valuesByRecord[row.record_id][row.field_id] = val;
  });

  return recordRows.map(r => ({
    ...r,
    values: valuesByRecord[r.id] || {}
  }));
}

async function createRecord({ id, databaseId, values }) {
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Insert record
    await conn.query(
      "INSERT INTO `records` (id, database_id, created_at) VALUES (?, ?, ?)",
      [id, databaseId, new Date()]
    );

    // 2. Insert values
    for (const [fieldId, value] of Object.entries(values)) {
      // Need field type to decide where to store
      const [fRows] = await conn.query("SELECT type FROM `fields` WHERE id = ?", [fieldId]);
      if (fRows.length === 0) continue;
      
      const type = fRows[0].type;
      let valText = null;
      let valBool = null;

      if (type === 'boolean') {
        valBool = value ? 1 : 0;
      } else {
        valText = String(value);
      }

      await conn.query(
        "INSERT INTO `record_values` (record_id, field_id, value_text, value_bool) VALUES (?, ?, ?, ?)",
        [id, fieldId, valText, valBool]
      );
    }

    await conn.commit();

    // Return the created record with its values
    return {
      id,
      databaseId,
      createdAt: new Date(),
      values
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function deleteRecordById(id) {
  const pool = getPool();
  await pool.query("DELETE FROM `records` WHERE id = ?", [id]);
  return true;
}

module.exports = {
  listRecordsByDatabaseId,
  createRecord,
  deleteRecordById,
};
