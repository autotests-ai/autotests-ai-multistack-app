'use strict';

const bcrypt = require('bcryptjs');

const ROUNDS = 10;

function hashPassword(password) {
  return bcrypt.hashSync(password, ROUNDS);
}

function checkPassword(password, passwordHash) {
  if (typeof passwordHash !== 'string' || passwordHash.length === 0) {
    return false;
  }
  try {
    return bcrypt.compareSync(password, passwordHash);
  } catch {
    return false;
  }
}

module.exports = { hashPassword, checkPassword, ROUNDS };
