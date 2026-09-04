package dev.multistack.compose.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import dev.multistack.compose.i18n.Dictionary
import dev.multistack.compose.ui.Btn
import dev.multistack.compose.ui.FontSize
import dev.multistack.compose.ui.InlineLink
import dev.multistack.compose.ui.LocalPalette
import dev.multistack.compose.ui.Metrics
import dev.multistack.compose.ui.Panel
import dev.multistack.compose.ui.PlaqueField
import dev.multistack.compose.ui.Space
import dev.multistack.compose.ui.testId

/** `pages/RegisterPage.tsx` — login + password + confirm, then POST /auth/register. */
@Composable
fun RegisterScreen(
    copy: Dictionary,
    submitting: Boolean,
    error: String,
    username: String,
    password: String,
    confirmPassword: String,
    onUsernameChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onConfirmPasswordChange: (String) -> Unit,
    onSubmit: () -> Unit,
    onLoginLink: () -> Unit,
) {
    val palette = LocalPalette.current
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = Space.pageX, vertical = Space.x6),
        contentAlignment = Alignment.Center,
    ) {
        Panel(
            title = copy.register.title,
            titleTestId = "register-form-title",
            modifier = Modifier
                .widthIn(max = Metrics.authPanelMaxWidth)
                .fillMaxWidth()
                .testId("register-panel"),
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().testId("register-form"),
                verticalArrangement = Arrangement.spacedBy(Space.x3),
            ) {
                PlaqueField(
                    label = copy.register.loginLabel,
                    value = username,
                    onValueChange = onUsernameChange,
                    testId = "register-login-input",
                )
                PlaqueField(
                    label = copy.register.passwordLabel,
                    value = password,
                    onValueChange = onPasswordChange,
                    testId = "register-password-input",
                    password = true,
                )
                PlaqueField(
                    label = copy.register.confirmLabel,
                    value = confirmPassword,
                    onValueChange = onConfirmPasswordChange,
                    testId = "confirm-password-input",
                    password = true,
                    imeAction = ImeAction.Go,
                    onImeAction = onSubmit,
                )
                Text(
                    text = error,
                    color = palette.danger,
                    fontSize = FontSize.sm,
                    modifier = Modifier
                        .fillMaxWidth()
                        .defaultMinSize(minHeight = ErrorRowMinHeight)
                        .testId("register-error-message"),
                )
                Btn(
                    label = copy.register.submit,
                    onClick = onSubmit,
                    testId = "register-submit-button",
                    block = true,
                    enabled = !submitting,
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = Space.x4),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "${copy.register.haveAccount} ",
                    color = palette.textMuted,
                    fontSize = FontSize.sm,
                )
                InlineLink(
                    label = copy.register.loginLink,
                    onClick = onLoginLink,
                    testId = "login-link",
                )
            }
        }
    }
}
