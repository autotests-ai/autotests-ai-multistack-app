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
        // Native stand-in for `window.confirm` — the web suite answers a
        // browser dialog, Appium taps these ids instead.
        .alert(copy.home.deleteAccount, isPresented: $state.confirmingDelete) {
            Button(copy.home.deleteConfirmCancel, role: .cancel) {
                state.cancelDelete()
            }
            .testId("delete-cancel-button")
            Button(copy.home.deleteConfirmOk, role: .destructive) {
                state.confirmDeleteAccount()
            }
            .testId("delete-confirm-button")
        } message: {
            Text(copy.home.deleteConfirm)
                .testId("delete-confirm-message")
        }
    }
}
