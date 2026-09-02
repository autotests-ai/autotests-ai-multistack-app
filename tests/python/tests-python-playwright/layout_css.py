"""Layout CSS parser — mirrors Java LayoutCss."""

from __future__ import annotations

import re

RESPONSIVE_BREAKPOINT_PX = 768
WIDE_LAYOUT_MIN_VIEWPORT_PX = RESPONSIVE_BREAKPOINT_PX + 1

_REPEAT_COLUMNS = re.compile(r"repeat\((\d+)")


def grid_column_count(grid_template_columns: str | None) -> int:
    if grid_template_columns is None:
        return 0
    normalized = grid_template_columns.strip()
    if not normalized or normalized == "none":
        return 0
    match = _REPEAT_COLUMNS.search(normalized)
    if match:
        return int(match.group(1))
    return len(normalized.split())
