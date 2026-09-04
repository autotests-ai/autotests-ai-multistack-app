package dev.multistack.compose

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.lifecycleScope
import dev.multistack.compose.data.AuthRepository
import dev.multistack.compose.data.Session

class MainActivity : ComponentActivity() {

    private lateinit var state: AppState

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val session = Session(applicationContext)
        state = AppState(
            session = session,
            repository = AuthRepository(session),
            scope = lifecycleScope,
            openUrl = ::openInBrowser,
        )
        if (state.screen == Screen.HOME) {
            state.loadHome()
        }

        setContent { MultistackRoot(state) }
    }

    /**
     * `js/header.js` closes the burger menu on `Escape`. There is no Escape on a
     * phone, but Appium can send one (`pressKeyCode(111)`), so the same
     * assertion runs on all three cells.
     */
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_ESCAPE && event.action == KeyEvent.ACTION_UP) {
            if (state.back()) {
                return true
            }
        }
        return super.dispatchKeyEvent(event)
    }

    private fun openInBrowser(url: String) {
        runCatching {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        }
    }
}
