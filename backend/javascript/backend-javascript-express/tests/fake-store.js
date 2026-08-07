'use strict';

const { DuplicateUsernameError } = require('../src/errors');

/**
 * In-memory stand-in for the pg store so route/service tests need no database.
 * Mirrors the same method names, return shapes and duplicate-username failure.
 */
function createFakeStore({ items = [], users = [] } = {}) {
  const state = {
    items: items.map((item, index) => ({ id: index + 1, ...item })),
    users: users.map((user, index) => ({ id: index + 1, ...user })),
  };
  let nextItemId = state.items.length + 1;
  let nextUserId = state.users.length + 1;

  return {
    state,

    async countItems() {
      return state.items.length;
    },

    async insertItems(rows) {
      for (const row of rows) {
        state.items.push({ id: nextItemId++, ...row });
      }
    },

    async listItems() {
      return [...state.items]
        .sort((a, b) => a.id - b.id)
        .map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
        }));
    },

    async findUserByUsername(username) {
      return state.users.find((user) => user.username === username) || null;
    },

    async insertUser(username, passwordHash) {
      if (state.users.some((user) => user.username === username)) {
        throw new DuplicateUsernameError(username);
      }
      const user = { id: nextUserId++, username, passwordHash };
      state.users.push(user);
      return { id: user.id, username };
    },

    async deleteUser(username) {
      state.users = state.users.filter((user) => user.username !== username);
    },
  };
}

module.exports = { createFakeStore };
