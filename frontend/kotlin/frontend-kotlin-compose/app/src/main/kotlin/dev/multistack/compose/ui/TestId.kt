package dev.multistack.compose.ui

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

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
    .testTag(id)
    .semantics { contentDescription = id }
