import SwiftUI

/// `pages/LoginPage.tsx`. `login-panel` wraps the panel, `login-form` the field
/// group; `error-message` is always present (empty text when there is nothing
/// to show), exactly like the `aria-live` paragraph in the SPA.
struct LoginView: View {
    @ObservedObject var state: AppState

    @Environment(\.palette) private var palette

    var body: some View {
        let copy = state.copy
        ScrollView {
            VStack {
                Panel(title: copy.login.title, titleTestId: "login-form-title") {
                    VStack(alignment: .leading, spacing: Space.x3) {
                        PlaqueField(
                            label: copy.login.loginLabel,
                            value: $state.loginUsername,
                            testId: "login-input"
                        )
                        PlaqueField(
                            label: copy.login.passwordLabel,
                            value: $state.loginPassword,
                            testId: "password-input",
                            secure: true,
                            onSubmit: state.submitLogin
                        )
                        Text(state.loginError)
                            .font(.system(size: FontSize.sm))
                            .foregroundColor(palette.danger)
                            .frame(
                                maxWidth: .infinity,
                                minHeight: Metrics.errorRowMinHeight,
                                alignment: .leading
                            )
                            .testId("error-message")
                        Btn(
                            label: copy.login.submit,
                            testId: "submit-button",
                            block: true,
                            enabled: !state.loginSubmitting,
                            action: state.submitLogin
                        )
                    }
                    .containerTestId("login-form")

                    HStack(spacing: Space.x1) {
                        Spacer(minLength: 0)
                        Text(copy.login.noAccount)
                            .font(.system(size: FontSize.sm))
                            .foregroundColor(palette.textMuted)
                        InlineLink(
                            label: copy.login.registerLink,
                            testId: "register-link"
                        ) { state.navigate(to: .register) }
                        Spacer(minLength: 0)
                    }
                    .padding(.top, Space.x3)
                }
                .frame(maxWidth: Metrics.authPanelMaxWidth)
                .containerTestId("login-panel")
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, Space.pageX)
            .padding(.vertical, Space.x6)
        }
    }
}
