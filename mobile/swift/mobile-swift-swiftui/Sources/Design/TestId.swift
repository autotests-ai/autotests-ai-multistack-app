import SwiftUI

extension View {
    /// Leaf testid — text, field, button. The same string the web cell puts in
    /// `data-testid` and the Compose cell puts in `contentDescription`, so
    /// XCUITest / Appium `accessibility id` drives all three cells.
    func testId(_ id: String) -> some View {
        accessibilityIdentifier(id)
    }

    /// Wrapper testid (`header`, `login-form`, `welcome-panel`, …). Keeps the
    /// container addressable while its children stay individually queryable —
    /// mirrors `data-testid` on a wrapper element.
    func containerTestId(_ id: String) -> some View {
        accessibilityElement(children: .contain)
            .accessibilityIdentifier(id)
    }

    /// Same as ``testId(_:)`` for slots whose id is optional (panel titles).
    @ViewBuilder
    func optionalTestId(_ id: String?) -> some View {
        if let id {
            accessibilityIdentifier(id)
        } else {
            self
        }
    }
}
