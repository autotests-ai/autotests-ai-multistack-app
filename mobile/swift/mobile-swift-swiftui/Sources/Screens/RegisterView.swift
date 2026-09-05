import SwiftUI

/// `pages/RegisterPage.tsx` — login + password + confirm, then POST /auth/register.
struct RegisterView: View {
    @ObservedObject var state: AppState

    @Environment(\.palette) private var palette

    var body: some View {
        let copy = state.copy
        ScrollView {
            VStack {
                Panel(title: copy.register.title, titleTestId: "register-form-title") {
                    VStack(alignment: .leading, spacing: Space.x3) {
                        PlaqueField(
                            label: copy.register.loginLabel,
                            value: $state.registerUsername,
                            testId: "register-login-input"
                        )
                        PlaqueField(
                            label: copy.register.passwordLabel,
                            value: $state.registerPassword,
                            testId: "register-password-input",
                            secure: true
                        )
                        PlaqueField(
                            label: copy.register.confirmLabel,
                            value: $state.registerConfirmPassword,
                            testId: "confirm-password-input",
                            secure: true,
                            onSubmit: state.submitRegister
                        )
                        Text(state.registerError)
                            .font(.system(size: FontSize.sm))
                            .foregroundColor(palette.danger)
                            .frame(
                                maxWidth: .infinity,
                                minHeight: Metrics.errorRowMinHeight,
                                alignment: .leading
                            )
                            .testId("register-error-message")
                        Btn(
                            label: copy.register.submit,
                            testId: "register-submit-button",
                            block: true,
                            enabled: !state.registerSubmitting,
                            action: state.submitRegister
                        )
                    }
                    .containerTestId("register-form")

                    HStack(spacing: Space.x1) {
                        Spacer(minLength: 0)
                        Text(copy.register.haveAccount)
                            .font(.system(size: FontSize.sm))
                            .foregroundColor(palette.textMuted)
                        InlineLink(
                            label: copy.register.loginLink,
                            testId: "login-link"
                        ) { state.navigate(to: .login) }
                        Spacer(minLength: 0)
                    }
                    .padding(.top, Space.x3)
                }
                .frame(maxWidth: Metrics.authPanelMaxWidth)
                .containerTestId("register-panel")
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, Space.pageX)
            .padding(.vertical, Space.x6)
        }
        #if os(iOS)
        .scrollDismissesKeyboard(.interactively)
        #endif
    }
}
