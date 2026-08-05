'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const { DuplicateUsernameError, UNIQUE_VIOLATION } = require('./errors');

const SCHEMA_PATH = path.join(__dirname, '..', 'schema.sql');

/**
 * The only place that talks to Postgres. Routes depend on this shape, so unit
 * tests can swap in an in-memory fake and run without a database.
 */
function createPgStore(databaseUrl) {
  const pool = new Pool({ connectionString: databaseUrl });

  return {
    async applySchema() {
      const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
      await pool.query(sql);
    },

    async countItems() {
      const { rows } = await pool.query('SELECT COUNT(*) AS count FROM items');
      return Number(rows[0].count);
    },

    async insertItems(items) {
      for (const item of items) {
        await pool.query(
          'INSERT INTO items (name, description) VALUES ($1, $2)',
          [item.name, item.description]
        );
      }
    },

    async listItems() {
      const { rows } = await pool.query(
        'SELECT id, name, description FROM items ORDER BY id ASC'
      );
      // BIGSERIAL arrives as a string from pg; the contract requires a JSON number.
      return rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
        description: row.description,
      }));
    },

    async findUserByUsername(username) {
      const { rows } = await pool.query(
        'SELECT id, username, password_hash FROM users WHERE username = $1',
        [username]
      );
      if (rows.length === 0) {
        return null;
      }
      return {
        id: Number(rows[0].id),
        username: rows[0].username,
        passwordHash: rows[0].password_hash,
      };
    },

    async insertUser(username, passwordHash) {
      try {
        const { rows } = await pool.query(
          'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
          [username, passwordHash]
        );
        return { id: Number(rows[0].id), username };
      } catch (error) {
        if (error && error.code === UNIQUE_VIOLATION) {
          throw new DuplicateUsernameError(username);
        }
        throw error;
      }
    },

    async close() {
      await pool.end();
    },
  };
}

module.exports = { createPgStore, SCHEMA_PATH };
