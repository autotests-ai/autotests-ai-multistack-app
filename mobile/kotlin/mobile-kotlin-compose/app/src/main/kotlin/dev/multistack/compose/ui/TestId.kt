package dev.multistack.compose.ui

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.testTag as platformTestTag
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.editableText
import androidx.compose.ui.semantics.focused
import androidx.compose.ui.semantics.insertTextAtCursor
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.password
import androidx.compose.ui.semantics.requestFocus
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setText
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.text.AnnotatedString

/**
 * One testid string, two Appium locators — the same value the web cell puts in
 * `data-testid`:
 *  - `content-desc` (Appium `accessibility id`) — cross-platform selector shared
 *    with the SwiftUI cell's `accessibilityIdentifier`
 *  - `resource-id` — via `testTag`, exported because the root sets
 *    `testTagsAsResourceId = true` (see [MultistackRoot])
 *
 * Semantics are **not** merged, so a container keeps its own id while children
 * stay individually findable (mirrors `data-testid` on a wrapper element).
 */
fun Modifier.testId(id: String): Modifier = this
    .platformTestTag(id)
    .semantics { contentDescription = id }

/**
 * Text-field testid. Compose moves `contentDescription` to a fake child when
 * the node still has children in the unmerged tree, so UiAutomator finds a
 * non-[android.widget.EditText] by accessibility id and `sendKeys` types
 * nothing. [clearAndSetSemantics] keeps `contentDescription == testid` on the
 * same leaf as `setText`. Do not use this on containers — children would vanish.
 */
fun Modifier.inputTestId(
    id: String,
    value: String,
    onValueChange: (String) -> Unit,
    isPassword: Boolean = false,
): Modifier = composed {
    val focusRequester = remember { FocusRequester() }
    var focused by remember { mutableStateOf(false) }
    focusRequester(focusRequester)
        .onFocusChanged { focused = it.isFocused }
        .clearAndSetSemantics {
            contentDescription = id
            testTag = id
            editableText = AnnotatedString(value)
            this.focused = focused
            setText {
                onValueChange(it.text)
                true
            }
            insertTextAtCursor {
                onValueChange(value + it.text)
                true
            }
            onClick {
                focusRequester.requestFocus()
                true
            }
            requestFocus {
                focusRequester.requestFocus()
                true
            }
            if (isPassword) {
                password()
            }
        }
}
