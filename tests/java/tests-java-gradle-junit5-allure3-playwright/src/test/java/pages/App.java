package pages;

import com.microsoft.playwright.Page;

/** Facade — one entry for all page objects (Playwright teaching style). */
public class App {

    public final Page page;
    public final LoginPage login;
    public final RegisterPage register;
    public final HomePage home;
    public final HeaderPage header;

    public App(Page page) {
        this.page = page;
        this.login = new LoginPage(page);
        this.register = new RegisterPage(page);
        this.home = new HomePage(page);
        this.header = new HeaderPage(page);
    }
}
