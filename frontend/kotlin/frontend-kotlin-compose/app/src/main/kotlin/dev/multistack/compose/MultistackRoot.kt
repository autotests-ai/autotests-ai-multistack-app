package dev.multistack.compose

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import dev.multistack.compose.i18n.dictionary
import dev.multistack.compose.i18n.formatMessage
import dev.multistack.compose.ui.AppHeader
import dev.multistack.compose.ui.DarkPalette
import dev.multistack.compose.ui.HeaderNavItem
import dev.multistack.compose.ui.LightPalette
import dev.multistack.compose.ui.LocalPalette
import dev.multistack.compose.ui.Metrics
import dev.multistack.compose.ui.screens.HomeScreen
import dev.multistack.compose.ui.screens.LoginScreen
import dev.multistack.compose.ui.screens.RegisterScreen

/**
 * The whole cell: fixed 40dp header on top, the active screen offset below it,
 * and the burger menu overlaying the content the way `.header__menu` does
 * (`position: absolute; top: 100%`).
 *
 * `testTagsAsResourceId` publishes every [dev.multistack.compose.ui.testId] as
 * an Android `resource-id`, so an Appium suite can match either that or the
 * `content-desc` shared with the SwiftUI cell.
 */
@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun MultistackRoot(state: AppState) {
    val palette = if (state.isLight) LightPalette else DarkPalette
    val copy = dictionary(state.lang)

    CompositionLocalProvider(LocalPalette provides palette) {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .background(palette.surface)
                .semantics { testTagsAsResourceId = true },
        ) {
            // Shell edge: ≤768 burger, ≥769 inline nav (rule `layout-standard`).
            val wide = maxWidth > Metrics.shellEdge
            val showInlineSearch = maxWidth > Metrics.searchEdge

            // `js/header.js` closes the menu once the burger stops being visible.
            LaunchedEffect(wide) {
                if (wide) {
                    state.closeMenu()
                }
            }

            BackHandler(enabled = true) {
                state.back()
            }

            val nav = listOf(
                HeaderNavItem(
                    label = copy.nav.home,
                    testId = "header-nav-home",
                    active = state.screen == Screen.HOME,
                    onClick = { state.navigate(Screen.HOME) },
                ),
                HeaderNavItem(
                    label = copy.nav.login,
                    testId = "header-nav-login",
                    active = state.screen == Screen.LOGIN,
                    onClick = { state.navigate(Screen.LOGIN) },
                ),
                HeaderNavItem(
                    label = copy.nav.register,
                    testId = "header-nav-register",
                    active = state.screen == Screen.REGISTER,
                    onClick = { state.navigate(Screen.REGISTER) },
                ),
                HeaderNavItem(
                    label = copy.nav.stack,
                    testId = "header-nav-stack",
                    active = false,
                    onClick = { state.openStackIndex() },
                ),
            )

            // `.page-shell--below-header` — content starts under the fixed bar.
            Box(Modifier.fillMaxSize().padding(top = Metrics.headerHeight)) {
                when (state.screen) {
                    Screen.LOGIN -> LoginScreen(
                        copy = copy,
                        submitting = state.loginSubmitting,
                        error = state.loginError,
                        username = state.loginUsername,
                        password = state.loginPassword,
                        onUsernameChange = { state.loginUsername = it },
                        onPasswordChange = { state.loginPassword = it },
                        onSubmit = state::submitLogin,
                        onRegisterLink = { state.navigate(Screen.REGISTER) },
                    )

                    Screen.REGISTER -> RegisterScreen(
                        copy = copy,
                        submitting = state.registerSubmitting,
                        error = state.registerError,
                        username = state.registerUsername,
                        password = state.registerPassword,
                        confirmPassword = state.registerConfirmPassword,
                        onUsernameChange = { state.registerUsername = it },
                        onPasswordChange = { state.registerPassword = it },
                        onConfirmPasswordChange = { state.registerConfirmPassword = it },
                        onSubmit = state::submitRegister,
                        onLoginLink = { state.navigate(Screen.LOGIN) },
                    )

                    Screen.HOME -> HomeScreen(
                        copy = copy,
                        welcomeName = state.welcomeName,
                        healthText = healthText(state, copy),
                        healthError = state.health is HealthState.Failed,
                        confirmingDelete = state.confirmingDelete,
                        onLogout = state::logout,
                        onDeleteAccountRequest = state::requestDeleteAccount,
                        onDeleteAccountConfirm = state::confirmDeleteAccount,
                        onDeleteAccountCancel = state::cancelDelete,
                    )
                }
            }

            AppHeader(
                nav = nav,
                lang = state.lang,
                isLight = state.isLight,
                copy = copy.header,
                wide = wide,
                showInlineSearch = showInlineSearch,
                menuOpen = state.menuOpen,
                search = state.search,
                menuSearch = state.menuSearch,
                onSearchChange = { state.search = it },
                onMenuSearchChange = { state.menuSearch = it },
                onBrandClick = { state.navigate(Screen.HOME) },
                onToggleLang = state::toggleLang,
                onToggleTheme = state::toggleTheme,
                onToggleMenu = state::toggleMenu,
                onNavItemClick = { item ->
                    // `.header__menu` click closes the menu, then navigates.
                    state.closeMenu()
                    item.onClick()
                },
            )
        }
    }
}

private fun healthText(
    state: AppState,
    copy: dev.multistack.compose.i18n.Dictionary,
): String = when (val health = state.health) {
    is HealthState.Checking -> copy.home.healthChecking
    is HealthState.Ok -> formatMessage(
        copy.home.healthOk,
        mapOf(
            "status" to health.status,
            "service" to health.service,
            "frontend" to UI_MOUNT,
        ),
    )

    is HealthState.Failed -> formatMessage(
        copy.home.healthError,
        mapOf("message" to health.message),
    )
}
