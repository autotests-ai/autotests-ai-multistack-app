'use strict';

const express = require('express');

/** Anything unparseable becomes `{}` so validation reports the missing field. */
function parseJsonBody(raw) {
  if (!raw || raw.length === 0) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw.toString('utf8'));
    return parsed !== null && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
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
