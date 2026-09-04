package dev.multistack.compose.ui

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Native mirror of `design-system/css/tokens.css`. Values are copied, not
 * invented — the web cell and this cell must read the same design SSOT.
 */
object Space {
    val x1 = 4.dp
    val x2 = 8.dp
    val x3 = 12.dp
    val x4 = 16.dp
    val x6 = 24.dp
    val x8 = 32.dp

    /** `--page-padding-x` */
    val pageX = x4
}

object Metrics {
    /** `--header-height` — the 40px bar. Content sits below it. */
    val headerHeight = 40.dp

    /** `--control-height-md` */
    val controlHeight = 36.dp

    /** `--plaque-control-height` */
    val plaqueHeight = 32.dp

    /** `--icon-size-md`; icon-btn hit area is `--control-height-md`. */
    val iconSize = 18.dp

    /** `--panel-bar-height` / `--panel-dot-size` / `--panel-dot-gap` */
    val panelBarHeight = 26.dp
    val panelDotSize = 8.dp
    val panelDotGap = 5.dp

    /** `--radius-sm` / `--radius-md` */
    val radiusSm = 8.dp
    val radiusMd = 12.dp

    /** `.auth-panel { width: min(440px, 100%) }` */
    val authPanelMaxWidth = 440.dp

    /** `--content-max-width` */
    val contentMaxWidth = 1300.dp

    /**
     * Shell edge (rule `layout-standard`): ≤768 burger, ≥769 inline nav.
     * Never both — the two branches are mutually exclusive in the tree.
     */
    val shellEdge = 768.dp

    /** `1023` — default header hides the inline search below this width. */
    val searchEdge = 1023.dp
}

object FontSize {
    /** `--font-size-base` = 1rem */
    val base = 16.sp

    /** `--font-size-sm` = 0.875rem */
    val sm = 14.sp

    /** `--font-size-xs` = 0.6875rem */
    val xs = 11.sp

    /** `--lang-label-font-size` */
    val langLabel = 8.sp
}

@Immutable
data class Palette(
    val surface: Color,
    val headerSurface: Color,
    val surfaceSoft: Color,
    val panelBar: Color,
    val text: Color,
    val textMuted: Color,
    val primary: Color,
    val primaryOn: Color,
    val danger: Color,
    val border: Color,
    val hoverBg: Color,
    val isLight: Boolean,
) {
    /** Decorative panel dots — macOS traffic lights at `--content` 55% alpha. */
    val dotClose = Color(0xFFFF5F57).copy(alpha = 0.55f)
    val dotMinimize = Color(0xFFFEBC2E).copy(alpha = 0.55f)
    val dotMaximize = Color(0xFF28C840).copy(alpha = 0.55f)
}

val DarkPalette = Palette(
    surface = Color(0xFF151414),
    headerSurface = Color(0xFF21201F),
    surfaceSoft = Color(0xFF262523),
    panelBar = Color(0xFF413F3C),
    text = Color(0xFFF1F5F9),
    textMuted = Color.White.copy(alpha = 0.45f),
    primary = Color(0xFFE8E4DF),
    primaryOn = Color(0xFF1C1917),
    danger = Color(0xFFF87171),
    border = Color.White.copy(alpha = 0.10f),
    hoverBg = Color.White.copy(alpha = 0.08f),
    isLight = false,
)

val LightPalette = Palette(
    surface = Color(0xFFFFFFFF),
    headerSurface = Color(0xFFF4F5F7),
    surfaceSoft = Color(0xFFEEF0F3),
    panelBar = Color(0xFFFFFFFF),
    text = Color(0xFF1F2937),
    textMuted = Color(0xFF0F172A).copy(alpha = 0.55f),
    primary = Color(0xFF111827),
    primaryOn = Color(0xFFF8FAFC),
    danger = Color(0xFFF87171),
    border = Color(0xFF0F172A).copy(alpha = 0.12f),
    hoverBg = Color(0xFF0F172A).copy(alpha = 0.06f),
    isLight = true,
)

val LocalPalette = staticCompositionLocalOf { DarkPalette }
