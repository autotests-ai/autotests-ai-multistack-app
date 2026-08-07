'use strict';

const express = require('express');

const { isJsonObject } = require('./validation');

/**
 * Returns null for an absent, malformed or non-object body, so the route can
 * answer "not valid JSON" instead of guessing from a missing field later.
 */
function parseJsonBody(raw) {
  if (!raw || raw.length === 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw.toString('utf8'));
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function lenientJson() {
  const raw = express.raw({ type: () => true, limit: '1mb' });
  return function lenientJsonMiddleware(req, res, next) {
    raw(req, res, (error) => {
      if (error) {
        next(error);
        return;
      }
      req.body = parseJsonBody(req.body);
      next();
    });
  };
}

module.exports = { parseJsonBody, lenientJson };
