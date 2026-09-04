package dev.multistack.compose

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import dev.multistack.compose.data.AuthRepository
import dev.multistack.compose.data.Session
import dev.multistack.compose.data.resolveAuthErrorMessage
import dev.multistack.compose.data.validateCredentials
import dev.multistack.compose.i18n.Lang
import dev.multistack.compose.i18n.dictionary
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

/** Product mount id, reported by the Health panel (SPA `UI_MOUNT`). */
const val UI_MOUNT = "frontend-kotlin-compose"

/** The SPA routes, minus the note screen: `/`, `/login`, `/register`. */
enum class Screen { HOME, LOGIN, REGISTER }

sealed interface HealthState {
    data object Checking : HealthState
    data class Ok(val status: String, val service: String) : HealthState
    data class Failed(val message: String) : HealthState
}

/**
 * Screen state + auth flow for the whole cell. Kept outside composition so
 * [MainActivity.dispatchKeyEvent] can close the burger menu on Escape, the way
 * `js/header.js` listens for `keydown`.
 */
class AppState(
    private val session: Session,
    private val repository: AuthRepository,
    private val scope: CoroutineScope,
    private val openUrl: (String) -> Unit,
) {
    var screen by mutableStateOf(if (session.token() != null) Screen.HOME else Screen.LOGIN)
        private set

    /** `theme: { default: 'dark' }` in `lib/headerConfig.ts`. */
    var isLight by mutableStateOf(false)
        private set

    /** `lang: { default: 'en' }`. */
    var lang by mutableStateOf(Lang.EN)
        private set

    var menuOpen by mutableStateOf(false)
        private set

    var search by mutableStateOf("")
    var menuSearch by mutableStateOf("")

    var loginUsername by mutableStateOf("")
    var loginPassword by mutableStateOf("")
    var loginError by mutableStateOf("")
        private set
    var loginSubmitting by mutableStateOf(false)
        private set

    var registerUsername by mutableStateOf("")
    var registerPassword by mutableStateOf("")
    var registerConfirmPassword by mutableStateOf("")
    var registerError by mutableStateOf("")
        private set
    var registerSubmitting by mutableStateOf(false)
        private set

    var welcomeName by mutableStateOf<String?>(null)
        private set
    var health by mutableStateOf<HealthState>(HealthState.Checking)
        private set
    var confirmingDelete by mutableStateOf(false)
        private set

    // ---- header ----------------------------------------------------------

    fun toggleMenu() {
        menuOpen = !menuOpen
    }

    fun closeMenu() {
        menuOpen = false
    }

    fun toggleLang() {
        lang = lang.other()
    }

    fun toggleTheme() {
        isLight = !isLight
    }

    /** `header-nav-stack` → `/stack/` board. No WebView: hand off to the browser. */
    fun openStackIndex() {
        openUrl(BuildConfig.STACK_INDEX_URL)
    }

    // ---- navigation ------------------------------------------------------

    fun navigate(target: Screen) {
        closeMenu()
        // `LoginPage`/`RegisterPage` bounce to `/` while a token is stored.
        screen = if (target != Screen.HOME && session.token() != null) Screen.HOME else target
        if (screen == Screen.HOME) {
            loadHome()
        }
    }

    /** Android back / Appium `pressKeyCode(ESCAPE)`. True when consumed. */
    fun back(): Boolean {
        if (menuOpen) {
            closeMenu()
            return true
        }
        if (confirmingDelete) {
            cancelDelete()
            return true
        }
        if (screen == Screen.REGISTER) {
            navigate(Screen.LOGIN)
            return true
        }
        return false
    }

    // ---- auth ------------------------------------------------------------

    fun submitLogin() {
        val messages = dictionary(lang).auth
        val username = loginUsername.trim()
        val password = loginPassword.trim()
        validateCredentials(username, password, messages)?.let {
            loginError = it
            return
        }
        loginError = ""
        loginSubmitting = true
        scope.launch {
            try {
                val response = repository.login(username, password)
                session.save(response.token)
                loginPassword = ""
                navigate(Screen.HOME)
            } catch (error: Exception) {
                loginError = resolveAuthErrorMessage(
                    error,
                    messages,
                    dictionary(lang).login.errorWrongCredentials,
                )
            } finally {
                loginSubmitting = false
            }
        }
    }

    fun submitRegister() {
        val copy = dictionary(lang)
        val username = registerUsername.trim()
        val password = registerPassword.trim()
        val confirm = registerConfirmPassword.trim()
        validateCredentials(username, password, copy.auth)?.let {
            registerError = it
            return
        }
        if (password != confirm) {
            registerError = copy.register.errorPasswordMismatch
            return
        }
        registerError = ""
        registerSubmitting = true
        scope.launch {
            try {
                val response = repository.register(username, password)
                session.save(response.token)
                registerPassword = ""
                registerConfirmPassword = ""
                navigate(Screen.HOME)
            } catch (error: Exception) {
                registerError = resolveAuthErrorMessage(
                    error,
                    copy.auth,
                    copy.register.errorRegistrationFailed,
                )
            } finally {
                registerSubmitting = false
            }
        }
    }

    fun logout() {
        scope.launch {
            repository.logout()
            welcomeName = null
            navigate(Screen.LOGIN)
        }
    }

    fun requestDeleteAccount() {
        confirmingDelete = true
    }

    fun cancelDelete() {
        confirmingDelete = false
    }

    fun confirmDeleteAccount() {
        confirmingDelete = false
        scope.launch {
            repository.deleteAccount()
            welcomeName = null
            navigate(Screen.LOGIN)
        }
    }

    /** `HomePage` mount effect: health probe + profile, session dropped on 401. */
    fun loadHome() {
        health = HealthState.Checking
        scope.launch {
            health = try {
                val payload = repository.health()
                HealthState.Ok(status = payload.status, service = payload.service)
            } catch (error: Exception) {
                HealthState.Failed(error.message.orEmpty())
            }
        }
        if (session.token() == null) {
            welcomeName = null
            return
        }
        scope.launch {
            welcomeName = try {
                repository.profile().username
            } catch (_: Exception) {
                session.clear()
                null
            }
        }
    }
}
