package dev.multistack.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.multistack.compose.i18n.HeaderCopy
import dev.multistack.compose.i18n.Lang

/** One nav row entry — mirrors `HeaderNavItem` in `js/header.js`. */
data class HeaderNavItem(
    val label: String,
    val testId: String,
    val active: Boolean,
    val onClick: () -> Unit,
)

/**
 * Native reimplementation of the design-system header (`templates/header.html`
 * + `js/header.js` + `css/header.css`). Native cannot load that JS, so the
 * chrome is rebuilt: 40dp bar, brand text `QA.GURU` (no SVG), the same testids, lang and
 * theme toggles, and the burger menu.
 *
 * Shell edge (rule `layout-standard`): `wide == false` → burger only,
 * `wide == true` → inline nav only. The two live in exclusive branches of the
 * tree, so — unlike CSS, where a weak `display: none` can lose — they can never
 * both be present. `header-nav` simply does not exist on a phone.
 */
@Composable
fun AppHeader(
    nav: List<HeaderNavItem>,
    lang: Lang,
    isLight: Boolean,
    copy: HeaderCopy,
    wide: Boolean,
    showInlineSearch: Boolean,
    menuOpen: Boolean,
    search: String,
    menuSearch: String,
    onSearchChange: (String) -> Unit,
    onMenuSearchChange: (String) -> Unit,
    onBrandClick: () -> Unit,
    onToggleLang: () -> Unit,
    onToggleTheme: () -> Unit,
    onToggleMenu: () -> Unit,
    onNavItemClick: (HeaderNavItem) -> Unit,
    modifier: Modifier = Modifier,
) {
    val palette = LocalPalette.current
    Column(modifier = modifier.fillMaxWidth().testId("header")) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(palette.headerSurface)
                .defaultMinSize(minHeight = Metrics.headerHeight)
                .height(Metrics.headerHeight)
                .padding(horizontal = Space.pageX),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Space.x4),
        ) {
            Text(
                text = "QA.GURU",
                color = palette.text,
                fontSize = FontSize.sm,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier
                    .clickable(onClick = onBrandClick)
                    .testId("header-brand-link"),
            )
            if (wide) {
                Row(
                    modifier = Modifier.weight(1f).testId("header-nav"),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Space.x3),
                ) {
                    nav.forEachIndexed { index, item ->
                        if (index > 0) {
                            PlaqueDivider()
                        }
                        NavLink(
                            label = item.label,
                            onClick = { onNavItemClick(item) },
                            testId = item.testId,
                            active = item.active,
                        )
                    }
                }
            } else {
                Box(Modifier.weight(1f))
            }

            if (wide && showInlineSearch) {
                HeaderSearch(
                    value = search,
                    onValueChange = onSearchChange,
                    placeholder = copy.searchPlaceholder,
                    testId = "header-search-input",
                    modifier = Modifier.weight(1f),
                )
            }

            Row(
                modifier = Modifier.testId("header-tools"),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Space.x1),
            ) {
                LangToggle(
                    lang = lang,
                    onClick = onToggleLang,
                    buttonTestId = "header-lang-toggle",
                    labelTestId = "header-lang-label",
                )
                IconBtn(
                    icon = if (isLight) IconSun else IconMoon,
                    onClick = onToggleTheme,
                    testId = "header-theme-toggle",
                )
                if (!wide) {
                    IconBtn(
                        icon = IconBurger,
                        onClick = onToggleMenu,
                        testId = "header-burger",
                    )
                }
            }
        }
        Box(Modifier.fillMaxWidth().height(1.dp).background(palette.border))

        // `.header__menu` — only ever rendered while the burger is the visible
        // control, so widening the viewport removes it (the CSS does the same
        // with the ≥769 hide rule).
        if (menuOpen && !wide) {
            HeaderMenu(
                nav = nav,
                lang = lang,
                isLight = isLight,
                copy = copy,
                menuSearch = menuSearch,
                onMenuSearchChange = onMenuSearchChange,
                onToggleLang = onToggleLang,
                onToggleTheme = onToggleTheme,
                onNavItemClick = onNavItemClick,
            )
        }
    }
}

@Composable
private fun HeaderMenu(
    nav: List<HeaderNavItem>,
    lang: Lang,
    isLight: Boolean,
    copy: HeaderCopy,
    menuSearch: String,
    onMenuSearchChange: (String) -> Unit,
    onToggleLang: () -> Unit,
    onToggleTheme: () -> Unit,
    onNavItemClick: (HeaderNavItem) -> Unit,
) {
    val palette = LocalPalette.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(palette.headerSurface)
            .padding(
                start = Space.pageX,
                end = Space.pageX,
                top = Space.x3,
                bottom = Space.x4,
            )
            .testId("header-menu"),
        verticalArrangement = Arrangement.spacedBy(Space.x3),
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().testId("header-menu-nav"),
            verticalArrangement = Arrangement.spacedBy(Space.x2),
        ) {
            nav.forEach { item ->
                NavLink(
                    label = item.label,
                    onClick = { onNavItemClick(item) },
                    // `header-nav-home` → `header-menu-nav-home` (js/header.js)
                    testId = item.testId.replace("header-nav-", "header-menu-nav-"),
                    active = item.active,
                    modifier = Modifier.padding(vertical = Space.x2),
                )
            }
        }
        Box(Modifier.fillMaxWidth().testId("header-menu-search")) {
            HeaderSearch(
                value = menuSearch,
                onValueChange = onMenuSearchChange,
                placeholder = copy.searchPlaceholder,
                testId = "header-menu-search-input",
                modifier = Modifier.fillMaxWidth(),
            )
        }
        Row(
            modifier = Modifier.testId("header-menu-tools"),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Space.x2),
        ) {
            LangToggle(
                lang = lang,
                onClick = onToggleLang,
                buttonTestId = "header-menu-lang-toggle",
                labelTestId = "header-menu-lang-label",
            )
            IconBtn(
                icon = if (isLight) IconSun else IconMoon,
                onClick = onToggleTheme,
                testId = "header-menu-theme-toggle",
            )
        }
        Box(Modifier.fillMaxWidth().height(1.dp).background(palette.border))
    }
}

/** `css/lang-toggle.css` — 36px icon-btn with an 8px label overlay. */
@Composable
private fun LangToggle(
    lang: Lang,
    onClick: () -> Unit,
    buttonTestId: String,
    labelTestId: String,
) {
    val palette = LocalPalette.current
    IconBtn(
        icon = IconGlobe,
        onClick = onClick,
        testId = buttonTestId,
    ) {
        Text(
            text = lang.code.uppercase(),
            color = palette.text,
            fontSize = FontSize.langLabel,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .offset(x = (-2).dp, y = (-2).dp)
                .testId(labelTestId),
        )
    }
}

/** `css/input.css` `.input` inside `.header__search`. */
@Composable
private fun HeaderSearch(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    testId: String,
    modifier: Modifier = Modifier,
) {
    val palette = LocalPalette.current
    Box(
        modifier = modifier
            .height(Metrics.controlHeight - Space.x2)
            .border(1.dp, palette.border, RoundedCornerShape(Metrics.radiusSm))
            .background(palette.surface, RoundedCornerShape(Metrics.radiusSm))
            .padding(horizontal = Space.x2),
        contentAlignment = Alignment.CenterStart,
    ) {
        if (value.isEmpty()) {
            Text(
                text = placeholder,
                color = palette.textMuted,
                fontSize = FontSize.sm,
            )
        }
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth().testId(testId),
            singleLine = true,
            textStyle = TextStyle(color = palette.text, fontSize = FontSize.sm),
            cursorBrush = SolidColor(palette.primary),
        )
    }
}
