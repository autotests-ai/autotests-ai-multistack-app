import SwiftUI

/// One nav row entry — mirrors `HeaderNavItem` in `js/header.js`.
struct HeaderNavItem: Identifiable {
    let label: String
    let testId: String
    let active: Bool
    let action: () -> Void

    var id: String { testId }

    /// `header-nav-home` → `header-menu-nav-home` (js/header.js).
    var menuTestId: String {
        testId.replacingOccurrences(of: "header-nav-", with: "header-menu-nav-")
    }
}

/// Native reimplementation of the design-system header (`templates/header.html`
/// + `js/header.js` + `css/header.css`). Native cannot load that JS, so the
/// chrome is rebuilt: 40pt bar, brand `Multistack`, the same testids, lang and
/// theme toggles, and the burger menu.
///
/// Shell edge (rule `layout-standard`): `wide == false` → burger only,
/// `wide == true` → inline nav only. The branches are exclusive, so — unlike
/// CSS, where a weak `display: none` can lose — they can never both exist.
struct AppHeader: View {
    let nav: [HeaderNavItem]
    let copy: HeaderCopy
    let lang: Lang
    let isLight: Bool
    let wide: Bool
    let showInlineSearch: Bool
    let menuOpen: Bool
    @Binding var search: String
    @Binding var menuSearch: String
    let onBrand: () -> Void
    let onToggleLang: () -> Void
    let onToggleTheme: () -> Void
    let onToggleMenu: () -> Void
    let onNavItem: (HeaderNavItem) -> Void

    @Environment(\.palette) private var palette

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: Space.x4) {
                Button(action: onBrand) {
                    Text("Multistack")
                        .font(.system(size: FontSize.sm, weight: .semibold))
                        .foregroundColor(palette.text)
                }
                .buttonStyle(.plain)
                .testId("header-brand-link")

                if wide {
                    HStack(spacing: Space.x3) {
                        ForEach(Array(nav.enumerated()), id: \.element.id) { index, item in
                            if index > 0 {
                                PlaqueDivider()
                            }
                            NavLink(
                                label: item.label,
                                testId: item.testId,
                                active: item.active
                            ) { onNavItem(item) }
                        }
                        Spacer(minLength: 0)
                    }
                    .containerTestId("header-nav")
                } else {
                    Spacer(minLength: 0)
                }

                if wide && showInlineSearch {
                    HeaderSearch(
                        value: $search,
                        placeholder: copy.searchPlaceholder,
                        testId: "header-search-input"
                    )
                }

                HStack(spacing: Space.x1) {
                    LangToggle(
                        lang: lang,
                        buttonTestId: "header-lang-toggle",
                        labelTestId: "header-lang-label",
                        action: onToggleLang
                    )
                    IconBtn(
                        systemName: isLight ? "sun.max" : "moon",
                        testId: "header-theme-toggle",
                        action: onToggleTheme
                    )
                    if !wide {
                        IconBtn(
                            systemName: "line.3.horizontal",
                            testId: "header-burger",
                            action: onToggleMenu
                        )
                    }
                }
                .containerTestId("header-tools")
            }
            .padding(.horizontal, Space.pageX)
            .frame(height: Metrics.headerHeight)
            .background(palette.headerSurface)

            Rectangle()
                .fill(palette.border)
                .frame(height: 1)

            // `.header__menu` — only rendered while the burger is the visible
            // control, so widening the viewport removes it (same as the CSS
            // ≥769 hide rule).
            if menuOpen && !wide {
                HeaderMenu(
                    nav: nav,
                    copy: copy,
                    lang: lang,
                    isLight: isLight,
                    menuSearch: $menuSearch,
                    onToggleLang: onToggleLang,
                    onToggleTheme: onToggleTheme,
                    onNavItem: onNavItem
                )
            }
        }
        .containerTestId("header")
    }
}

private struct HeaderMenu: View {
    let nav: [HeaderNavItem]
    let copy: HeaderCopy
    let lang: Lang
    let isLight: Bool
    @Binding var menuSearch: String
    let onToggleLang: () -> Void
    let onToggleTheme: () -> Void
    let onNavItem: (HeaderNavItem) -> Void

    @Environment(\.palette) private var palette

    var body: some View {
        VStack(alignment: .leading, spacing: Space.x3) {
            VStack(alignment: .leading, spacing: Space.x2) {
                ForEach(nav) { item in
                    NavLink(
                        label: item.label,
                        testId: item.menuTestId,
                        active: item.active
                    ) { onNavItem(item) }
                    .padding(.vertical, Space.x2)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .containerTestId("header-menu-nav")

            HeaderSearch(
                value: $menuSearch,
                placeholder: copy.searchPlaceholder,
                testId: "header-menu-search-input"
            )
            .containerTestId("header-menu-search")

            HStack(spacing: Space.x2) {
                LangToggle(
                    lang: lang,
                    buttonTestId: "header-menu-lang-toggle",
                    labelTestId: "header-menu-lang-label",
                    action: onToggleLang
                )
                IconBtn(
                    systemName: isLight ? "sun.max" : "moon",
                    testId: "header-menu-theme-toggle",
                    action: onToggleTheme
                )
                Spacer(minLength: 0)
            }
            .containerTestId("header-menu-tools")

            Rectangle()
                .fill(palette.border)
                .frame(height: 1)
        }
        .padding(.horizontal, Space.pageX)
        .padding(.top, Space.x3)
        .padding(.bottom, Space.x4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(palette.headerSurface)
        .containerTestId("header-menu")
    }
}

/// `css/lang-toggle.css` — 36pt icon-btn with an 8pt label overlay.
private struct LangToggle: View {
    let lang: Lang
    let buttonTestId: String
    let labelTestId: String
    let action: () -> Void

    @Environment(\.palette) private var palette

    var body: some View {
        IconBtn(systemName: "globe", testId: buttonTestId, action: action) {
            Text(lang.rawValue.uppercased())
                .font(.system(size: FontSize.langLabel, weight: .semibold))
                .foregroundColor(palette.text)
                .padding(.trailing, 2)
                .padding(.bottom, 2)
                .testId(labelTestId)
        }
    }
}

/// `css/input.css` `.input` inside `.header__search`.
private struct HeaderSearch: View {
    @Binding var value: String
    let placeholder: String
    let testId: String

    @Environment(\.palette) private var palette

    var body: some View {
        TextField("", text: $value, prompt: Text(placeholder).foregroundColor(palette.textMuted))
            .textFieldStyle(.plain)
            .font(.system(size: FontSize.sm))
            .foregroundColor(palette.text)
            .padding(.horizontal, Space.x2)
            .frame(height: Metrics.controlHeight - Space.x2)
            .background(palette.surface)
            .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusSm))
            .overlay(
                RoundedRectangle(cornerRadius: Metrics.radiusSm)
                    .stroke(palette.border, lineWidth: 1)
            )
            .testId(testId)
    }
}
