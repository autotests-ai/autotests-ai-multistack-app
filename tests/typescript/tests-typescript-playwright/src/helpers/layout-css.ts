export const RESPONSIVE_BREAKPOINT_PX = 768;

const REPEAT_COLUMNS = /repeat\((\d+)/;

export function gridColumnCount(gridTemplateColumns: string | null | undefined): number {
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
