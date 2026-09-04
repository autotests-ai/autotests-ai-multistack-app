package dev.multistack.compose.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import dev.multistack.compose.i18n.Dictionary
import dev.multistack.compose.ui.Btn
import dev.multistack.compose.ui.BtnVariant
import dev.multistack.compose.ui.FontSize
import dev.multistack.compose.ui.LocalPalette
import dev.multistack.compose.ui.Metrics
import dev.multistack.compose.ui.Panel
import dev.multistack.compose.ui.Space
import dev.multistack.compose.ui.testId

/**
 * `pages/HomePage.tsx` minus the note surface: no items list, no `GET
 * /api/items`, no note form. What stays is the session panel
 * (`welcome-panel` / `welcome-message` / logout / delete) plus the optional
 * health probe.
 */
@Composable
fun HomeScreen(
    copy: Dictionary,
    welcomeName: String?,
    healthText: String,
    healthError: Boolean,
    confirmingDelete: Boolean,
    onLogout: () -> Unit,
    onDeleteAccountRequest: () -> Unit,
    onDeleteAccountConfirm: () -> Unit,
    onDeleteAccountCancel: () -> Unit,
) {
    val palette = LocalPalette.current
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = Space.pageX, vertical = Space.x4)
            .testId("multistack-layout"),
        verticalArrangement = Arrangement.spacedBy(Space.x4),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        val panelWidth = Modifier.widthIn(max = Metrics.contentMaxWidth).fillMaxWidth()

        Panel(title = copy.home.title, modifier = panelWidth) {
            Text(
                text = copy.home.blurb.replace("{api}", "/api/auth/me"),
                color = palette.textMuted,
                fontSize = FontSize.base,
            )
        }

        // `hidden={welcomeName === null}` in the SPA — the panel is absent until
        // GET /auth/me answers, so `welcome-panel` appearing means "signed in".
        if (welcomeName != null) {
            Panel(
                title = copy.home.session,
                modifier = panelWidth.testId("welcome-panel"),
            ) {
                Text(
                    text = copy.home.welcome.replace("{username}", welcomeName),
                    color = palette.text,
                    fontSize = FontSize.base,
                    modifier = Modifier.testId("welcome-message"),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(Space.x2)) {
                    Btn(
                        label = copy.home.logout,
                        onClick = onLogout,
                        testId = "logout-button",
                    )
                    Btn(
                        label = copy.home.deleteAccount,
                        onClick = onDeleteAccountRequest,
                        testId = "delete-account-button",
                        variant = BtnVariant.DANGER,
                    )
                }
            }
        }

        Panel(title = copy.home.health, modifier = panelWidth) {
            Text(
                text = healthText,
                color = if (healthError) palette.danger else palette.textMuted,
                fontSize = FontSize.sm,
                modifier = Modifier.testId("health-status"),
            )
        }
    }

    // Native stand-in for `window.confirm` — the web suite answers a browser
    // dialog, Appium taps these ids instead.
    if (confirmingDelete) {
        AlertDialog(
            onDismissRequest = onDeleteAccountCancel,
            title = {
                Text(text = copy.home.deleteAccount, color = palette.text)
            },
            text = {
                Text(
                    text = copy.home.deleteConfirm,
                    color = palette.text,
                    modifier = Modifier.testId("delete-confirm-message"),
                )
            },
            confirmButton = {
                Btn(
                    label = copy.home.deleteConfirmOk,
                    onClick = onDeleteAccountConfirm,
                    testId = "delete-confirm-button",
                    variant = BtnVariant.DANGER,
                )
            },
            dismissButton = {
                Btn(
                    label = copy.home.deleteConfirmCancel,
                    onClick = onDeleteAccountCancel,
                    testId = "delete-cancel-button",
                )
            },
            containerColor = palette.surfaceSoft,
            modifier = Modifier.testId("delete-confirm-dialog"),
        )
    }
}
