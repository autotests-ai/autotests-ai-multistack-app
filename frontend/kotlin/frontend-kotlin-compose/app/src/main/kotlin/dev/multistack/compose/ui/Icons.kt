package dev.multistack.compose.ui

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.unit.dp

/**
 * The design-system header glyphs, ported by path data — burger from
 * `templates/header.html`, sun/moon from `js/theme-icons.js`, globe from the
 * lang toggle. Stroke is baked white and re-coloured by `Icon(tint = …)`.
 */
private fun strokeIcon(vararg pathData: String): ImageVector =
    ImageVector.Builder(
        defaultWidth = Metrics.iconSize,
        defaultHeight = Metrics.iconSize,
        viewportWidth = 24f,
        viewportHeight = 24f,
    ).apply {
        for (data in pathData) {
            addPath(
                pathData = addPathNodes(data),
                stroke = SolidColor(Color.White),
                strokeLineWidth = 1.6f,
                strokeLineCap = StrokeCap.Round,
                strokeLineJoin = StrokeJoin.Round,
            )
        }
    }.build()

/** `<path d="M4 7h16M4 12h16M4 17h16"/>` */
val IconBurger: ImageVector = strokeIcon("M4 7h16M4 12h16M4 17h16")

/** Globe: `<circle r="10">` as a path + meridian + equator. */
val IconGlobe: ImageVector = strokeIcon(
    "M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0",
    "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",
    "M2 12h20",
)

/** `THEME_ICON_MOON` — shown while the dark theme is active. */
val IconMoon: ImageVector = strokeIcon("M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z")

/** `THEME_ICON_SUN` — shown while the light theme is active. */
val IconSun: ImageVector = strokeIcon(
    "M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0",
    "M12 2v2",
    "M12 20v2",
    "M4.93 4.93l1.41 1.41",
    "M17.66 17.66l1.41 1.41",
    "M2 12h2",
    "M20 12h2",
    "M4.93 19.07l1.41-1.41",
    "M17.66 6.34l1.41-1.41",
)

/** Magnifier for the header search field placeholder row. */
val IconSearch: ImageVector = strokeIcon(
    "M4 11a7 7 0 1 0 14 0a7 7 0 1 0 -14 0",
    "M16 16l4 4",
)
