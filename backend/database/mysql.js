const mysql = require("mysql2/promise");

function getMysqlConfig() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "fieldbase",
    waitForConnections: true,
    connectionLimit: process.env.DB_CONNECTION_LIMIT
      ? Number(process.env.DB_CONNECTION_LIMIT)
      : 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    multipleStatements: true,
  };
}

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(getMysqlConfig());
  }
  return pool;
}

async function ping() {
  const p = getPool();
  const connection = await p.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

module.exports = {
  getMysqlConfig,
  getPool,
  ping,
};
