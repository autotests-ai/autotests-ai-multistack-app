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
import androidx.compose.ui.unit.dp
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

/** `.auth-error { min-height: 1.2em }` at `--font-size-sm`. */
internal val ErrorRowMinHeight = 17.dp

/**
 * `pages/LoginPage.tsx`. `login-panel` wraps the panel, `login-form` the field
 * group; `error-message` is always present (empty text when there is nothing to
 * show), exactly like the `aria-live` paragraph in the SPA.
 */
@Composable
fun LoginScreen(
    copy: Dictionary,
    submitting: Boolean,
    error: String,
    username: String,
    password: String,
    onUsernameChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onSubmit: () -> Unit,
    onRegisterLink: () -> Unit,
) {
    val palette = LocalPalette.current
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = Space.pageX, vertical = Space.x6),
        contentAlignment = Alignment.Center,
    ) {
        Panel(
            title = copy.login.title,
            titleTestId = "login-form-title",
            modifier = Modifier
                .widthIn(max = Metrics.authPanelMaxWidth)
                .fillMaxWidth()
                .testId("login-panel"),
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().testId("login-form"),
                verticalArrangement = Arrangement.spacedBy(Space.x3),
            ) {
                PlaqueField(
                    label = copy.login.loginLabel,
                    value = username,
                    onValueChange = onUsernameChange,
                    testId = "login-input",
                )
                PlaqueField(
                    label = copy.login.passwordLabel,
                    value = password,
                    onValueChange = onPasswordChange,
                    testId = "password-input",
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
                        .testId("error-message"),
                )
                Btn(
                    label = copy.login.submit,
                    onClick = onSubmit,
                    testId = "submit-button",
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
                    text = "${copy.login.noAccount} ",
                    color = palette.textMuted,
                    fontSize = FontSize.sm,
                )
                InlineLink(
                    label = copy.login.registerLink,
                    onClick = onRegisterLink,
                    testId = "register-link",
                )
            }
        }
    }
}
