import SwiftUI

/// `pages/HomePage.tsx` minus the note surface: no items list, no
/// `GET /api/items`, no note form. What stays is the session panel
/// (`welcome-panel` / `welcome-message` / logout / delete) plus the optional
/// health probe.
struct HomeView: View {
    @ObservedObject var state: AppState

    @Environment(\.palette) private var palette

    var body: some View {
        let copy = state.copy
        ScrollView {
            VStack(spacing: Space.x4) {
                Panel(title: copy.home.title) {
                    Text(copy.home.blurb.replacingOccurrences(of: "{api}", with: "/api/auth/me"))
                        .font(.system(size: FontSize.base))
                        .foregroundColor(palette.textMuted)
                }

                // `hidden={welcomeName === null}` in the SPA — the panel is
                // absent until GET /auth/me answers, so `welcome-panel`
                // appearing means "signed in".
                if let welcomeName = state.welcomeName {
                    Panel(title: copy.home.session) {
                        Text(
                            copy.home.welcome.replacingOccurrences(
                                of: "{username}",
                                with: welcomeName
                            )
                        )
                        .font(.system(size: FontSize.base))
                        .foregroundColor(palette.text)
                        .testId("welcome-message")

                        HStack(spacing: Space.x2) {
                            Btn(
                                label: copy.home.logout,
                                testId: "logout-button",
                                action: state.logout
                            )
                            Btn(
                                label: copy.home.deleteAccount,
                                testId: "delete-account-button",
                                variant: .danger,
                                action: state.requestDeleteAccount
                            )
                        }
                    }
                    .containerTestId("welcome-panel")
                }

                Panel(title: copy.home.health) {
                    Text(state.healthText)
                        .font(.system(size: FontSize.sm))
                        .foregroundColor(state.healthFailed ? palette.danger : palette.textMuted)
                        .testId("health-status")
                }
            }
            .frame(maxWidth: Metrics.contentMaxWidth)
            .padding(.horizontal, Space.pageX)
            .padding(.vertical, Space.x4)
        }
        .containerTestId("multistack-layout")
    }
}

/// In-app twin of the Compose `AlertDialog`. SwiftUI `.alert` does not
/// reliably expose `accessibilityIdentifier` to XCUITest, so Appium would
/// miss `delete-confirm-button`. Cancel (and a scrim tap) keep the session.
struct DeleteConfirmDialog: View {
    let copy: HomeCopy
    let onConfirm: () -> Void
    let onCancel: () -> Void

    @Environment(\.palette) private var palette

    var body: some View {
        ZStack {
            Color.black.opacity(0.45)
                .ignoresSafeArea()
                .onTapGesture(perform: onCancel)

            VStack(alignment: .leading, spacing: Space.x3) {
                Text(copy.deleteAccount)
                    .font(.system(size: FontSize.base, weight: .semibold))
                    .foregroundColor(palette.text)
                Text(copy.deleteConfirm)
                    .font(.system(size: FontSize.sm))
                    .foregroundColor(palette.text)
                    .testId("delete-confirm-message")
                HStack(spacing: Space.x2) {
                    Btn(
                        label: copy.deleteConfirmCancel,
                        testId: "delete-cancel-button",
                        action: onCancel
                    )
                    Btn(
                        label: copy.deleteConfirmOk,
                        testId: "delete-confirm-button",
                        variant: .danger,
                        action: onConfirm
                    )
                    Spacer(minLength: 0)
                }
            }
            .padding(Space.x4)
            .background(palette.surfaceSoft)
            .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusSm))
            .overlay(
                RoundedRectangle(cornerRadius: Metrics.radiusSm)
                    .stroke(palette.border, lineWidth: 1)
            )
            .padding(.horizontal, Space.pageX)
            .containerTestId("delete-confirm-dialog")
        }
    }
}
