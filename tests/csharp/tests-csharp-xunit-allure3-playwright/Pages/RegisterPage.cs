using Allure.Net.Commons.Attributes;
using Helpers;
using Microsoft.Playwright;

namespace Pages;

public sealed class RegisterPage
{
    private readonly IPage _page;
    public readonly ILocator RegisterForm;
    public readonly ILocator LoginInput;
    public readonly ILocator PasswordInput;
    public readonly ILocator ConfirmPasswordInput;
    public readonly ILocator SubmitButton;
    public readonly ILocator FormTitle;
    public readonly ILocator ErrorMessage;
    public readonly ILocator LoginLink;
    public HeaderPage Header { get; set; } = null!;

    public RegisterPage(IPage page)
    {
        _page = page;
        RegisterForm = page.GetByTestId("register-form");
        LoginInput = page.GetByTestId("register-login-input");
        PasswordInput = page.GetByTestId("register-password-input");
        ConfirmPasswordInput = page.GetByTestId("confirm-password-input");
        SubmitButton = page.GetByTestId("register-submit-button");
        FormTitle = page.GetByTestId("register-form-title");
        ErrorMessage = page.GetByTestId("register-error-message");
        LoginLink = page.GetByTestId("login-link");
    }

    [AllureStep("Open register page")]
    public RegisterPage OpenPage()
    {
        Pw.Run(_page.GotoAsync("register"));
        return ShouldBeOpen();
    }

    [AllureStep("Verify register page is open")]
    public RegisterPage ShouldBeOpen()
    {
        Pw.Run(RegisterForm.WaitForAsync());
        return this;
    }

    [AllureStep("Verify register form is mounted")]
    public RegisterPage ShouldShowRegisterForm()
    {
        Pw.Run(FormTitle.WaitForAsync());
        Pw.Run(LoginInput.WaitForAsync());
        Pw.Run(PasswordInput.WaitForAsync());
        Pw.Run(ConfirmPasswordInput.WaitForAsync());
        Pw.Run(SubmitButton.WaitForAsync());
        return this;
    }

    [AllureStep("Sign up as {username}")]
    public RegisterPage Signup(string username, string password) =>
        Signup(username, password, password);

    [AllureStep("Sign up as {username}")]
    public RegisterPage Signup(string username, string password, string confirmPassword)
    {
        Pw.Run(LoginInput.FillAsync(username));
        Pw.Run(PasswordInput.FillAsync(password));
        Pw.Run(ConfirmPasswordInput.FillAsync(confirmPassword));
        Pw.Run(SubmitButton.ClickAsync());
        return this;
    }

    [AllureStep("Fill and submit register form")]
    public HomePage FillAndSubmitForm(string username, string password, string confirmPassword)
    {
        Signup(username, password, confirmPassword);
        return new HomePage(_page) { Header = Header };
    }

    [AllureStep("Type username: {username}")]
    public RegisterPage TypeUsername(string username)
    {
        Pw.Run(LoginInput.FillAsync(username));
        return this;
    }

    [AllureStep("Type password")]
    public RegisterPage TypePassword(string password)
    {
        Pw.Run(PasswordInput.FillAsync(password));
        return this;
    }

    [AllureStep("Type confirm password")]
    public RegisterPage TypeConfirmPassword(string password)
    {
        Pw.Run(ConfirmPasswordInput.FillAsync(password));
        return this;
    }

    [AllureStep("Submit register form expecting validation or API error")]
    public RegisterPage SubmitExpectingError()
    {
        Pw.Run(SubmitButton.ClickAsync());
        Pw.Run(ErrorMessage.WaitForAsync());
        return this;
    }

    [AllureStep("Click Login link under the register form")]
    public LoginPage ClickLoginLink()
    {
        Pw.Run(LoginLink.ClickAsync());
        return new LoginPage(_page) { Header = Header };
    }

    [AllureStep("Reload current page")]
    public RegisterPage ReloadPage()
    {
        Pw.Run(_page.ReloadAsync());
        return ShouldBeOpen();
    }

    [AllureStep("Verify form title message: {message}")]
    public RegisterPage ShouldHaveFormTitle(string message)
    {
        Pw.Run(Assertions.Expect(FormTitle).ToContainTextAsync(message));
        return this;
    }

    [AllureStep("Verify error message: {message}")]
    public RegisterPage ShouldHaveErrorMessage(string message)
    {
        Pw.Run(ErrorMessage.WaitForAsync());
        Pw.Run(Assertions.Expect(ErrorMessage).ToContainTextAsync(message));
        return this;
    }
}
