'use strict';

const fs = require('fs');
const path = require('path');

const RESOURCES = path.join(__dirname, '..', 'resources');

function readOpenApiResource(name) {
  return fs.readFileSync(path.join(RESOURCES, name));
}

module.exports = { RESOURCES, readOpenApiResource };
