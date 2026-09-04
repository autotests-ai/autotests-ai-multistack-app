package dev.multistack.compose.data

import android.content.Context
import android.content.SharedPreferences
import dev.multistack.compose.BuildConfig

/**
 * The SPA keeps the token in `localStorage` under `authToken:<backendId>`
 * (`lib/appBase.ts authTokenStorageKey`). SharedPreferences is the native
 * equivalent and reuses the same key, so a session is scoped per matrix backend
 * and never leaks across cells.
 */
class Session(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("multistack-auth", Context.MODE_PRIVATE)

    val tokenKey: String = BuildConfig.BACKEND_ID
        .takeIf { it.isNotBlank() }
        ?.let { "authToken:$it" }
        ?: "authToken"

    fun token(): String? = prefs.getString(tokenKey, null)?.takeIf { it.isNotBlank() }

    fun save(token: String) {
        prefs.edit().putString(tokenKey, token).apply()
    }

    fun clear() {
        prefs.edit().remove(tokenKey).apply()
    }
}
