import SwiftUI

/// `css/panel.css` `.panel.panel--content` — 1px shell, 8pt radius, 26pt bar
/// with the three decorative dots and an 11pt/600 muted title.
struct Panel<Content: View>: View {
    let title: String
    var titleTestId: String?
    var spacing: CGFloat = Space.x3
    @ViewBuilder var content: () -> Content

    @Environment(\.palette) private var palette

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: Space.x2) {
                HStack(spacing: Metrics.panelDotGap) {
                    dot(palette.dotClose)
                    dot(palette.dotMinimize)
                    dot(palette.dotMaximize)
                }
                Text(title)
                    .font(.system(size: FontSize.xs, weight: .semibold))
                    .foregroundColor(palette.textMuted)
                    .lineLimit(1)
                    .optionalTestId(titleTestId)
                Spacer(minLength: 0)
            }
            .padding(.leading, Space.x3)
            .padding(.trailing, Space.x2)
            .frame(height: Metrics.panelBarHeight)
            .background(palette.panelBar)

            Rectangle()
                .fill(palette.border)
                .frame(height: 1)

            VStack(alignment: .leading, spacing: spacing) {
                content()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Space.x4)
        }
        .background(palette.surfaceSoft)
        .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusSm))
        .overlay(
            RoundedRectangle(cornerRadius: Metrics.radiusSm)
                .stroke(palette.border, lineWidth: 1)
        )
    }

    private func dot(_ color: Color) -> some View {
        Circle()
            .fill(color)
            .frame(width: Metrics.panelDotSize, height: Metrics.panelDotSize)
    }
}

enum BtnVariant {
    case primary
    case danger
}

/// `css/button.css` `.btn.btn--primary` / `.btn--danger`, `.btn--block`.
struct Btn: View {
    let label: String
    let testId: String
    var variant: BtnVariant = .primary
    var block: Bool = false
    var enabled: Bool = true
    let action: () -> Void

    @Environment(\.palette) private var palette

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: FontSize.base, weight: .medium))
                .foregroundColor(variant == .primary ? palette.primaryOn : palette.surface)
                .padding(.horizontal, Space.x4)
                .frame(maxWidth: block ? .infinity : nil, minHeight: Metrics.controlHeight)
                .background(variant == .primary ? palette.primary : palette.danger)
                .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusSm))
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
        .opacity(enabled ? 1 : 0.5)
        .testId(testId)
    }
}

/// `css/plaque-field.css` `.plaque-field--divided` with a human caption:
/// caption `.plaque-field__text` | `.plaque-divider` | right-aligned control.
struct PlaqueField: View {
    let label: String
    @Binding var value: String
    let testId: String
    var secure: Bool = false
    var onSubmit: () -> Void = {}

    @Environment(\.palette) private var palette
    @FocusState private var focused: Bool

    var body: some View {
        HStack(spacing: Space.x2) {
            Text(label)
                .font(.system(size: FontSize.sm))
                .foregroundColor(palette.text)
                .lineLimit(1)
            PlaqueDivider()
            field
                .font(.system(size: FontSize.sm))
                .foregroundColor(palette.text)
                .multilineTextAlignment(.trailing)
                .textFieldStyle(.plain)
                .focused($focused)
                .submitLabel(.go)
                .onSubmit(onSubmit)
                .padding(.trailing, Metrics.plaqueControlTrail)
                .testId(testId)
        }
        .padding(.horizontal, Space.x2)
        .frame(height: Metrics.plaqueHeight)
        .background(palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusSm))
        .overlay(
            RoundedRectangle(cornerRadius: Metrics.radiusSm)
                .stroke(focused ? palette.primary : palette.border, lineWidth: 1)
        )
    }

    @ViewBuilder private var field: some View {
        if secure {
            SecureField("", text: $value)
        } else {
            TextField("", text: $value)
        }
    }
}

/// `css/plaque-divider.css` — fixed 1px rule, height `--font-size-sm * 1.35`.
struct PlaqueDivider: View {
    @Environment(\.palette) private var palette

    var body: some View {
        Rectangle()
            .fill(palette.border)
            .frame(width: 1, height: Metrics.dividerHeight)
    }
}

/// `.link--nav` — 12pt/500, underlined; active drops the underline.
struct NavLink: View {
    let label: String
    let testId: String
    let active: Bool
    let action: () -> Void

    @Environment(\.palette) private var palette

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: FontSize.nav, weight: .medium))
                .foregroundColor(palette.text)
                .underline(!active)
                .lineLimit(1)
        }
        .buttonStyle(.plain)
        .testId(testId)
    }
}

/// `.link` inside body copy (login / register footer links).
struct InlineLink: View {
    let label: String
    let testId: String
    let action: () -> Void

    @Environment(\.palette) private var palette

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: FontSize.sm))
                .foregroundColor(palette.primary)
        }
        .buttonStyle(.plain)
        .testId(testId)
    }
}

/// `.icon-btn` — 36pt hit area around an 18pt glyph. The design-system glyphs
/// map to their SF Symbol equivalents (burger, globe, moon/sun, magnifier).
struct IconBtn<Overlay: View>: View {
    let systemName: String
    let testId: String
    let action: () -> Void
    @ViewBuilder var overlay: () -> Overlay

    @Environment(\.palette) private var palette

    var body: some View {
        Button(action: action) {
            ZStack(alignment: .bottomTrailing) {
                Image(systemName: systemName)
                    .font(.system(size: Metrics.iconSize - 2, weight: .regular))
                    .foregroundColor(palette.text)
                    .frame(width: Metrics.controlHeight, height: Metrics.controlHeight)
                overlay()
            }
        }
        .buttonStyle(.plain)
        .testId(testId)
    }
}

extension IconBtn where Overlay == EmptyView {
    init(systemName: String, testId: String, action: @escaping () -> Void) {
        self.init(systemName: systemName, testId: testId, action: action) { EmptyView() }
    }
}
