/// Must match `@media (max-width: …)` in frontend/css/header.css.
pub const RESPONSIVE_BREAKPOINT_PX: i32 = 768;

/// Desktop layout starts at breakpoint + 1px.
pub const WIDE_LAYOUT_MIN_VIEWPORT_PX: i32 = RESPONSIVE_BREAKPOINT_PX + 1;

/// C# `LayoutCss.GridColumnCount` analog.
pub fn grid_column_count(grid_template_columns: Option<&str>) -> i32 {
    let Some(raw) = grid_template_columns else {
        return 0;
    };
    let normalized = raw.trim();
    if normalized.is_empty() || normalized == "none" {
        return 0;
    }
    if let Some(idx) = normalized.find("repeat(") {
        let after = &normalized[idx + "repeat(".len()..];
        let digits: String = after.chars().take_while(|c| c.is_ascii_digit()).collect();
        if !digits.is_empty() {
            return digits.parse().unwrap_or(0);
        }
    }
    normalized.split_whitespace().count() as i32
}
