import SwiftUI

/// Native mirror of `design-system/css/tokens.css`. Values are copied, not
/// invented — the web cell and this cell read the same design SSOT.
enum Space {
    static let x1: CGFloat = 4
    static let x2: CGFloat = 8
    static let x3: CGFloat = 12
    static let x4: CGFloat = 16
    static let x6: CGFloat = 24
    static let x8: CGFloat = 32

    /// `--page-padding-x`
    static let pageX: CGFloat = x4
}

enum Metrics {
    /// `--header-height` — the 40pt bar. Content sits below it.
    static let headerHeight: CGFloat = 40

    /// `--control-height-md`
    static let controlHeight: CGFloat = 36

    /// `--plaque-control-height`
    static let plaqueHeight: CGFloat = 32

    /// `--icon-size-md`
    static let iconSize: CGFloat = 18

    /// `--panel-bar-height` / `--panel-dot-size` / `--panel-dot-gap`
    static let panelBarHeight: CGFloat = 26
    static let panelDotSize: CGFloat = 8
    static let panelDotGap: CGFloat = 5

    /// `--radius-sm` / `--radius-md`
    static let radiusSm: CGFloat = 8
    static let radiusMd: CGFloat = 12

    /// `.auth-panel { width: min(440px, 100%) }`
    static let authPanelMaxWidth: CGFloat = 440

    /// `--content-max-width`
    static let contentMaxWidth: CGFloat = 1300

    /// Shell edge (rule `layout-standard`): ≤768 burger, ≥769 inline nav.
    static let shellEdge: CGFloat = 768

    /// `1023` — the default header hides the inline search below this width.
    static let searchEdge: CGFloat = 1023

    /// `.plaque-divider` height = `--font-size-sm * 1.35`.
    static let dividerHeight: CGFloat = 19

    /// `input.plaque-field__control` reserves `--plaque-select-trail`.
    static let plaqueControlTrail: CGFloat = 30

    /// `.auth-error { min-height: 1.2em }` at `--font-size-sm`.
    static let errorRowMinHeight: CGFloat = 17
}

enum FontSize {
    /// `--font-size-base` = 1rem
    static let base: CGFloat = 16

    /// `--font-size-sm` = 0.875rem
    static let sm: CGFloat = 14

    /// `--font-size-xs` = 0.6875rem
    static let xs: CGFloat = 11

    /// `.link--nav { font-size: 12px }`
    static let nav: CGFloat = 12

    /// `--lang-label-font-size`
    static let langLabel: CGFloat = 8
}

struct Palette {
    let surface: Color
    let headerSurface: Color
    let surfaceSoft: Color
    let panelBar: Color
    let text: Color
    let textMuted: Color
    let primary: Color
    let primaryOn: Color
    let danger: Color
    let border: Color
    let isLight: Bool

    /// Decorative panel dots — macOS traffic lights at `--content` 55% alpha.
    let dotClose = Color(red: 1.0, green: 0.373, blue: 0.341).opacity(0.55)
    let dotMinimize = Color(red: 0.996, green: 0.737, blue: 0.180).opacity(0.55)
    let dotMaximize = Color(red: 0.157, green: 0.784, blue: 0.251).opacity(0.55)

    static let dark = Palette(
        surface: Color(hex: 0x151414),
        headerSurface: Color(hex: 0x21201F),
        surfaceSoft: Color(hex: 0x262523),
        panelBar: Color(hex: 0x413F3C),
        text: Color(hex: 0xF1F5F9),
        textMuted: Color.white.opacity(0.45),
        primary: Color(hex: 0xE8E4DF),
        primaryOn: Color(hex: 0x1C1917),
        danger: Color(hex: 0xF87171),
        border: Color.white.opacity(0.10),
        isLight: false
    )

    static let light = Palette(
        surface: Color(hex: 0xFFFFFF),
        headerSurface: Color(hex: 0xF4F5F7),
        surfaceSoft: Color(hex: 0xEEF0F3),
        panelBar: Color(hex: 0xFFFFFF),
        text: Color(hex: 0x1F2937),
        textMuted: Color(hex: 0x0F172A).opacity(0.55),
        primary: Color(hex: 0x111827),
        primaryOn: Color(hex: 0xF8FAFC),
        danger: Color(hex: 0xF87171),
        border: Color(hex: 0x0F172A).opacity(0.12),
        isLight: true
    )
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}

private struct PaletteKey: EnvironmentKey {
    static let defaultValue = Palette.dark
}

extension EnvironmentValues {
    var palette: Palette {
        get { self[PaletteKey.self] }
        set { self[PaletteKey.self] = newValue }
    }
}
