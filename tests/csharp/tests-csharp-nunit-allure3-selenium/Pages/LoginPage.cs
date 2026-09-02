using Allure.NUnit.Attributes;
using Helpers;
using OpenQA.Selenium;

namespace Pages;

public sealed class LoginPage : BasePage<LoginPage>
{
    [AllureStep("Open login page")]
    public LoginPage OpenPage()
    {
        Ui.Open("/login");
        return ShouldBeOpen();
    }

    [AllureStep("Click Register link under the login form")]
    public RegisterPage ClickRegisterLink()
    {
        Ui.Click("register-link");
        return new RegisterPage();
    }

    [AllureStep("Fill and submit form")]
    public HomePage FillAndSubmitForm(string username, string password)
    {
        TypeUsername(username);
        TypePassword(password);
        return Submit();
    }

    [AllureStep("Type username: {username}")]
    public LoginPage TypeUsername(string username)
    {
        Ui.SetValue("login-input", username);
        return this;
    }

    [AllureStep("Type password")]
    public LoginPage TypePassword(string password)
    {
        Ui.SetValue("password-input", password);
        return this;
    }

    [AllureStep("Submit login form")]
    public HomePage Submit()
    {
        Ui.Click("submit-button");
        return new HomePage();
    }

    [AllureStep("Submit login form expecting validation error")]
    public LoginPage SubmitExpectingError()
    {
        Ui.Click("submit-button");
        Ui.ShouldBeVisible("error-message");
        return this;
    }

    [AllureStep("Verify login page is open")]
    public override LoginPage ShouldBeOpen()
    {
        Ui.ShouldBeVisible("login-form");
        return this;
    }

    [AllureStep("Verify login form is mounted")]
    public LoginPage ShouldShowLoginForm()
    {
        Ui.ShouldBeVisible("login-form-title");
        Ui.ShouldBeVisible("login-input");
        Ui.ShouldBeVisible("password-input");
        Ui.ShouldBeVisible("submit-button");
        return this;
    }

    [AllureStep("Login form panel is visible")]
    public IWebElement LoginFormPanel() => Ui.El("login-form");

    [AllureStep("Verify form title message: {message}")]
    public LoginPage ShouldHaveFormTitle(string message)
    {
        Ui.ShouldHaveText("login-form-title", message);
        return this;
    }

    [AllureStep("Verify error message: {message}")]
    public LoginPage ShouldHaveErrorMessage(string message)
    {
        Ui.ShouldHaveText("error-message", message);
        return this;
    }
}
