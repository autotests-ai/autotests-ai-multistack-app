#!/usr/bin/env node
/**
 * Official artillery.io HTML reporter (same as `artillery report` in 2.0.21).
 * 2.0.34 still writes --output JSON but removed the report subcommand.
 */
'use strict';

const fs = require('fs');
const path = require('path');

let output = '';
const files = [];
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === '--output' || arg === '-o') {
    output = process.argv[i + 1] || '';
    i += 1;
    continue;
  }
  if (!arg.startsWith('-')) {
    files.push(arg);
  }
}
const jsonPath = files[0] || '';
if (!jsonPath) {
  process.stderr.write('usage: artillery-report.js --output index.html artillery-report.json\n');
  process.exit(1);
}
if (!output) {
  output = `${jsonPath}.html`;
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
if (Array.isArray(data.intermediate)) {
  data.intermediate.forEach((row) => {
    if (row && typeof row === 'object') {
      delete row.latencies;
    }
  });
}
data.name = path.basename(jsonPath);

const templatePath = path.join(__dirname, 'artillery-report', 'index.html.ejs');
const template = fs.readFileSync(templatePath, 'utf8');
if (!template.includes('<%= report %>')) {
  process.stderr.write('STOP: official Artillery HTML template missing <%= report %>\n');
  process.exit(1);
}
const html = template.replace('<%= report %>', JSON.stringify(data, null, 2));
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, html);
process.stdout.write(`Report generated: ${output}\n`);
