const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      fullName: user.full_name,
    },
    secret,
    { expiresIn }
  );
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = {
  normalizeEmail,
  signToken,
  hashPassword,
  verifyPassword,
};
