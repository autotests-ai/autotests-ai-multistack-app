package pages;

import java.time.Duration;

/**
 * Wait budgets shared by page objects. {@link #PAGE_READY} is for first paint after
 * navigation (SPA mount + API fetches); interactions after mount use the Selenide default.
 */
public final class PageTimeouts {

    public static final Duration PAGE_READY = Duration.ofSeconds(10);

    private PageTimeouts() {
    }
}
