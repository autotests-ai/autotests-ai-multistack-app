const REPEAT_COLUMNS = /repeat\((\d+)/;

function gridColumnCount(gridTemplateColumns) {
  if (gridTemplateColumns == null) {
    return 0;
  }
  const normalized = String(gridTemplateColumns).trim();
  if (!normalized || normalized === 'none') {
    return 0;
  }
  const match = normalized.match(REPEAT_COLUMNS);
  if (match) {
    return Number.parseInt(match[1], 10);
  }
  return normalized.split(/\s+/).length;
}

module.exports = { gridColumnCount, RESPONSIVE_BREAKPOINT_PX: 768 };
