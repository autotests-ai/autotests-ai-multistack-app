import SwiftUI

/// The whole cell: fixed 40pt header on top, the active screen offset below it,
/// and the burger menu overlaying the content the way `.header__menu` does
/// (`position: absolute; top: 100%`).
struct RootView: View {
    @StateObject private var state = AppState()
    @Environment(\.openURL) private var openURL

    var body: some View {
        let palette = state.isLight ? Palette.light : Palette.dark

        GeometryReader { geometry in
            // Shell edge: ≤768 burger, ≥769 inline nav (rule `layout-standard`).
            let wide = geometry.size.width > Metrics.shellEdge
            let showInlineSearch = geometry.size.width > Metrics.searchEdge

            ZStack(alignment: .top) {
                palette.surface.ignoresSafeArea()

                // `.page-shell--below-header` — content starts under the bar.
                screen
                    .padding(.top, Metrics.headerHeight)

                AppHeader(
                    nav: navItems,
                    copy: state.copy.header,
                    lang: state.lang,
                    isLight: state.isLight,
                    wide: wide,
                    showInlineSearch: showInlineSearch,
                    menuOpen: state.menuOpen,
                    search: Binding(get: { state.search }, set: { state.search = $0 }),
                    menuSearch: Binding(get: { state.menuSearch }, set: { state.menuSearch = $0 }),
                    onBrand: { state.navigate(to: .home) },
                    onToggleLang: state.toggleLang,
                    onToggleTheme: state.toggleTheme,
                    onToggleMenu: state.toggleMenu,
                    onNavItem: { item in
                        // `.header__menu` click closes the menu, then navigates.
                        state.closeMenu()
                        item.action()
                    }
                )
            }
            // `js/header.js` closes the menu once the burger stops being visible.
            .onChange(of: wide) { _, isWide in
                if isWide {
                    state.closeMenu()
                }
            }
        }
        .environment(\.palette, palette)
        .preferredColorScheme(state.isLight ? .light : .dark)
        .onAppear {
            if state.screen == .home {
                state.loadHome()
            }
        }
        // `js/header.js` closes the burger menu on `Escape`; on iOS this needs
        // a hardware keyboard (simulator / Appium `mobile: keys`).
        .onKeyPress(.escape) {
            state.back() ? .handled : .ignored
        }
    }

    @ViewBuilder private var screen: some View {
        switch state.screen {
        case .login:
            LoginView(state: state)
        case .register:
            RegisterView(state: state)
        case .home:
            HomeView(state: state)
        }
    }

    private var navItems: [HeaderNavItem] {
        let copy = state.copy
        return [
            HeaderNavItem(
                label: copy.nav.home,
                testId: "header-nav-home",
                active: state.screen == .home
            ) { state.navigate(to: .home) },
            HeaderNavItem(
                label: copy.nav.login,
                testId: "header-nav-login",
                active: state.screen == .login
            ) { state.navigate(to: .login) },
            HeaderNavItem(
                label: copy.nav.register,
                testId: "header-nav-register",
                active: state.screen == .register
            ) { state.navigate(to: .register) },
            // `header-nav-stack` → `/stack/` board. No WebView: hand off to
            // the system browser.
            HeaderNavItem(
                label: copy.nav.stack,
                testId: "header-nav-stack",
                active: false
            ) {
                if let url = URL(string: Config.stackIndexUrl) {
                    openURL(url)
                }
            },
        ]
    }
}
