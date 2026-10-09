using Allure.NUnit.Attributes;
using Helpers;
using OpenQA.Selenium;

namespace Pages;

public sealed class HomePage : BasePage<HomePage>
{
    private const string DeleteAccountConfirm =
        "Delete this account? This cannot be undone.";

    [AllureStep("Open home page")]
    public HomePage OpenPage()
    {
        Ui.Open("/");
        return ShouldBeOpen();
    }

    [AllureStep("Open home page with local storage authentication")]
    public HomePage OpenPageWithLocalStorageAuthentication(string username, string password)
    {
        base.OpenPageWithLocalStorageAuthentication("/", username, password);
        return ShouldBeOpen();
    }

    [AllureStep("Open home page with invalid local storage token")]
    public HomePage OpenPageWithInvalidToken()
    {
        OpenPageWithLocalStorageToken("/", "invalid-token");
        return ShouldBeOpen();
    }

    [AllureStep("Verify home page is open")]
    public override HomePage ShouldBeOpen()
    {
        Ui.ShouldBeVisible("multistack-layout");
        return this;
    }

    [AllureStep("Verify home layout is mounted")]
    public HomePage ShouldShowLayout()
    {
        Ui.ShouldBeVisible("multistack-layout");
        Ui.ShouldBeVisible("items-list");
        return this;
    }

    [AllureStep("Verify home layout and health are mounted")]
    public HomePage ShouldShowLayoutAndHealth()
    {
        Ui.ShouldBeVisible("multistack-layout");
        Ui.ShouldBeVisible("health-status");
        return this;
    }

    [AllureStep("Home layout panel is visible")]
    public IWebElement LayoutPanel() => Ui.El("multistack-layout");

    [AllureStep("Welcome panel is visible")]
    public IWebElement WelcomePanelElement() => Ui.El("welcome-panel");

    [AllureStep("Verify welcome panel stays hidden")]
    public HomePage ShouldHideWelcomePanel()
    {
        Ui.ShouldHaveAttribute("welcome-panel", "hidden", "");
        return this;
    }

    [AllureStep("Verify auth token was cleared from localStorage")]
    public HomePage ShouldClearAuthToken()
    {
        WaitForAuthTokenToBeCleared();
        return this;
    }

    [AllureStep("Verify health status contains: {textFragment}")]
    public HomePage ShouldShowHealthText(string textFragment)
    {
        Ui.ShouldHaveText("health-status", textFragment);
        return this;
    }

    [AllureStep("Verify items list contains: {textFragment}")]
    public HomePage ShouldShowItemText(string textFragment)
    {
        Ui.ShouldHaveText("items-list", textFragment);
        return this;
    }

    [AllureStep("Verify items panel shows a readable error: {textFragment}")]
    public HomePage ShouldShowItemsError(string textFragment)
    {
        Ui.ShouldHaveText("items-list", textFragment);
        return this;
    }

    [AllureStep("Verify health panel shows a readable error: {textFragment}")]
    public HomePage ShouldShowHealthError(string textFragment)
    {
        Ui.ShouldHaveText("health-status", textFragment);
        return this;
    }

    [AllureStep("Verify welcome message: {message}")]
    public HomePage ShouldHaveWelcomeMessage(string message)
    {
        Ui.ShouldBeVisible("welcome-panel");
        Ui.ShouldHaveText("welcome-message", message);
        return this;
    }

    [AllureStep("Verify session panel offers logout and delete account")]
    public HomePage ShouldShowSessionActions()
    {
        Ui.ShouldBeVisible("logout-button");
        Ui.ShouldHaveText("logout-button", "Logout");
        Ui.ShouldBeVisible("delete-account-button");
        Ui.ShouldHaveText("delete-account-button", "Delete account");
        return this;
    }

    [AllureStep("Click logout button")]
    public LoginPage ClickLogoutButton()
    {
        Ui.Click("logout-button");
        return new LoginPage();
    }

    [AllureStep("Click delete account and confirm")]
    public LoginPage ClickDeleteAccountAndConfirm()
    {
        Ui.Click("delete-account-button");
        Ui.Confirm(DeleteAccountConfirm);
        return new LoginPage();
    }

    [AllureStep("Click delete account and cancel the confirm")]
    public HomePage ClickDeleteAccountAndCancel()
    {
        Ui.Click("delete-account-button");
        Ui.Dismiss(DeleteAccountConfirm);
        return this;
    }

    [AllureStep("Verify auth token remains in localStorage")]
    public HomePage ShouldKeepAuthToken()
    {
        WaitForAuthTokenToBePresent();
        return this;
    }
}
