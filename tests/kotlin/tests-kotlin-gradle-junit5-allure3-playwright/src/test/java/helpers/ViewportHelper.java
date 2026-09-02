package helpers;

import com.microsoft.playwright.Page;
import config.ConfigReader;
import io.qameta.allure.Step;

public final class ViewportHelper {

    private static final ThreadLocal<Page> PAGE = new ThreadLocal<>();

    private ViewportHelper() {
    }

    public static void bind(Page page) {
        PAGE.set(page);
    }

    public static void unbind() {
        PAGE.remove();
    }

    public static Page page() {
        var page = PAGE.get();
        if (page == null) {
            throw new IllegalStateException("ViewportHelper.bind() was not called for this thread");
        }
        return page;
    }

    @Step("Reset viewport to default browser size")
    public static void resetViewport() {
        var page = PAGE.get();
        if (page == null) {
            return;
        }
        var size = parseBrowserSize(ConfigReader.testConfig.browserSize());
        page.setViewportSize(size.width(), size.height());
    }

    public static void setViewport(int width, int height) {
        page().setViewportSize(width, height);
    }

    private static Viewport parseBrowserSize(String browserSize) {
        var parts = browserSize.split("x");
        if (parts.length != 2) {
            throw new IllegalStateException("Invalid browserSize: " + browserSize);
        }
        return new Viewport(Integer.parseInt(parts[0].trim()), Integer.parseInt(parts[1].trim()));
    }

    private record Viewport(int width, int height) {
    }
}
