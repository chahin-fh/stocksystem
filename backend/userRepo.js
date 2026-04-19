const { getPool } = require("./database/mysql");

async function findUserByEmail(email) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, full_name, email, password_hash, created_at, updated_at FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0] || null;
}

async function createUser({ id, fullName, email, passwordHash }) {
  const pool = getPool();
  await pool.query(
    "INSERT INTO users (id, full_name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
    [id, fullName, email, passwordHash, new Date()]
  );

  const [rows] = await pool.query(
    "SELECT id, full_name, email, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0];
}

module.exports = {
  findUserByEmail,
  createUser,
};
