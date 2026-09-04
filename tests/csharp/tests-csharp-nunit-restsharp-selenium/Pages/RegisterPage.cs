using Allure.NUnit.Attributes;
using Helpers;

namespace Pages;

public sealed class RegisterPage : BasePage<RegisterPage>
{
    [AllureStep("Open register page")]
    public RegisterPage OpenPage()
    {
        Ui.Open("/register");
        return ShouldBeOpen();
    }

    [AllureStep("Click Login link under the register form")]
    public LoginPage ClickLoginLink()
    {
        Ui.Click("login-link");
        return new LoginPage();
    }

    [AllureStep("Fill and submit register form")]
    public HomePage FillAndSubmitForm(string username, string password, string confirmPassword)
    {
        TypeUsername(username);
        TypePassword(password);
        TypeConfirmPassword(confirmPassword);
        return Submit();
    }

    [AllureStep("Type username: {username}")]
    public RegisterPage TypeUsername(string username)
    {
        Ui.SetValue("register-login-input", username);
        return this;
    }

    [AllureStep("Type password")]
    public RegisterPage TypePassword(string password)
    {
        Ui.SetValue("register-password-input", password);
        return this;
    }

    [AllureStep("Type confirm password")]
    public RegisterPage TypeConfirmPassword(string confirmPassword)
    {
        Ui.SetValue("confirm-password-input", confirmPassword);
        return this;
    }

    [AllureStep("Submit register form")]
    public HomePage Submit()
    {
        Ui.Click("register-submit-button");
        return new HomePage();
    }

    [AllureStep("Submit register form expecting validation or API error")]
    public RegisterPage SubmitExpectingError()
    {
        Ui.Click("register-submit-button");
        Ui.ShouldBeVisible("register-error-message");
        return this;
    }

    [AllureStep("Verify register page is open")]
    public override RegisterPage ShouldBeOpen()
    {
        Ui.ShouldBeVisible("register-form");
        return this;
    }

    [AllureStep("Verify register form is mounted")]
    public RegisterPage ShouldShowRegisterForm()
    {
        Ui.ShouldBeVisible("register-form-title");
        Ui.ShouldBeVisible("register-login-input");
        Ui.ShouldBeVisible("register-password-input");
        Ui.ShouldBeVisible("confirm-password-input");
        Ui.ShouldBeVisible("register-submit-button");
        return this;
    }

    [AllureStep("Verify form title message: {message}")]
    public RegisterPage ShouldHaveFormTitle(string message)
    {
        Ui.ShouldHaveText("register-form-title", message);
        return this;
    }

    [AllureStep("Verify error message: {message}")]
    public RegisterPage ShouldHaveErrorMessage(string message)
    {
        Ui.ShouldBeVisible("register-error-message");
        Ui.ShouldHaveText("register-error-message", message);
        return this;
    }
}
