package dev.multistack.compose.data

import dev.multistack.compose.i18n.AuthCopy
import dev.multistack.compose.i18n.formatMessage
import org.json.JSONObject

/** `_contract/flows/login.md` — the auth surface this cell talks to. */
data class AuthResponse(val token: String, val username: String, val redirectUrl: String?)

data class UserProfile(val username: String)

data class Health(val status: String, val service: String)

/** `lib/auth.ts` MIN_LOGIN_LENGTH / MIN_PASSWORD_LENGTH. */
const val MIN_LOGIN_LENGTH = 3
const val MIN_PASSWORD_LENGTH = 6

class AuthRepository(private val session: Session) {

    suspend fun login(username: String, password: String): AuthResponse =
        ApiClient.request(
            method = "POST",
            path = "/auth/login",
            body = JSONObject().put("username", username).put("password", password),
        ).toAuthResponse()

    suspend fun register(username: String, password: String): AuthResponse =
        ApiClient.request(
            method = "POST",
            path = "/auth/register",
            body = JSONObject().put("username", username).put("password", password),
        ).toAuthResponse()

    suspend fun profile(): UserProfile {
        val token = session.token() ?: throw ApiError("Missing auth token")
        val payload = ApiClient.request(method = "GET", path = "/auth/me", token = token)
        return UserProfile(username = payload.optString("username"))
    }

    suspend fun health(): Health {
        val payload = ApiClient.request(method = "GET", path = "/health")
        return Health(
            status = payload.optString("status"),
            service = payload.optString("service"),
        )
    }

    /**
     * Logout and account deletion both drop the local session even when the
     * call fails — a dead token must never keep the UI signed in (`lib/auth.ts`).
     */
    suspend fun logout() {
        val token = session.token()
        if (token != null) {
            runCatching { ApiClient.request("POST", "/auth/logout", token = token) }
        }
        session.clear()
    }

    suspend fun deleteAccount() {
        val token = session.token()
        if (token != null) {
            runCatching { ApiClient.request("DELETE", "/auth/me", token = token) }
        }
        session.clear()
    }

    private fun JSONObject.toAuthResponse(): AuthResponse = AuthResponse(
        token = optString("token"),
        username = optString("username"),
        redirectUrl = optString("redirectUrl").takeIf { it.isNotBlank() },
    )
}

/** `lib/auth.ts validateCredentials` — same order, same messages. */
fun validateCredentials(login: String, password: String, copy: AuthCopy): String? {
    val minima = mapOf("minLogin" to MIN_LOGIN_LENGTH, "minPassword" to MIN_PASSWORD_LENGTH)
    return when {
        login.isEmpty() && password.isEmpty() -> formatMessage(copy.errorBothRequired, minima)
        login.isEmpty() -> formatMessage(copy.errorLoginRequired, minima)
        login.length < MIN_LOGIN_LENGTH -> formatMessage(copy.errorLoginMinLength, minima)
        password.isEmpty() -> formatMessage(copy.errorPasswordRequired, minima)
        password.length < MIN_PASSWORD_LENGTH -> formatMessage(copy.errorPasswordMinLength, minima)
        else -> null
    }
}

/** `lib/auth.ts resolveAuthErrorMessage`. */
fun resolveAuthErrorMessage(error: Throwable, copy: AuthCopy, fallback: String): String {
    val api = error as? ApiError
    return when {
        api?.network == true -> copy.errorNetwork
        !error.message.isNullOrBlank() -> error.message!!
        else -> fallback
    }
}
