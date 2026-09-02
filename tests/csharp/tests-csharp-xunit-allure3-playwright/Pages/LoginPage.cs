using Allure.Net.Commons.Attributes;
using Helpers;
using Microsoft.Playwright;

namespace Pages;

public sealed class LoginPage
{
    private readonly IPage _page;
    public readonly ILocator LoginForm;
    public readonly ILocator LoginInput;
    public readonly ILocator PasswordInput;
    public readonly ILocator SubmitButton;
    public readonly ILocator FormTitle;
    public readonly ILocator ErrorMessage;
    public readonly ILocator RegisterLink;
    public HeaderPage Header { get; set; } = null!;

    public LoginPage(IPage page)
    {
        _page = page;
        LoginForm = page.GetByTestId("login-form");
        LoginInput = page.GetByTestId("login-input");
        PasswordInput = page.GetByTestId("password-input");
        SubmitButton = page.GetByTestId("submit-button");
        FormTitle = page.GetByTestId("login-form-title");
        ErrorMessage = page.GetByTestId("error-message");
        RegisterLink = page.GetByTestId("register-link");
    }

    [AllureStep("Open login page")]
    public LoginPage OpenPage()
    {
        Pw.Run(_page.GotoAsync("login"));
        return ShouldBeOpen();
    }

    [AllureStep("Verify login page is open")]
    public LoginPage ShouldBeOpen()
    {
        Pw.Run(LoginForm.WaitForAsync());
        return this;
    }

    [AllureStep("Verify login form is mounted")]
    public LoginPage ShouldShowLoginForm()
    {
        Pw.Run(FormTitle.WaitForAsync());
        Pw.Run(LoginInput.WaitForAsync());
        Pw.Run(PasswordInput.WaitForAsync());
        Pw.Run(SubmitButton.WaitForAsync());
        return this;
    }

    [AllureStep("Fill login form as {username}")]
    public LoginPage Login(string username, string password)
    {
        Pw.Run(LoginInput.FillAsync(username));
        Pw.Run(PasswordInput.FillAsync(password));
        Pw.Run(SubmitButton.ClickAsync());
        return this;
    }

    [AllureStep("Fill and submit form")]
    public HomePage FillAndSubmitForm(string username, string password)
    {
        Login(username, password);
        return new HomePage(_page) { Header = Header };
    }

    [AllureStep("Type username: {username}")]
    public LoginPage TypeUsername(string username)
    {
        Pw.Run(LoginInput.FillAsync(username));
        return this;
    }

    [AllureStep("Type password")]
    public LoginPage TypePassword(string password)
    {
        Pw.Run(PasswordInput.FillAsync(password));
        return this;
    }

    [AllureStep("Submit login form expecting validation error")]
    public LoginPage SubmitExpectingError()
    {
        Pw.Run(SubmitButton.ClickAsync());
        Pw.Run(ErrorMessage.WaitForAsync());
        return this;
    }

    [AllureStep("Click Register link under the login form")]
    public RegisterPage ClickRegisterLink()
    {
        Pw.Run(RegisterLink.ClickAsync());
        return new RegisterPage(_page) { Header = Header };
    }

    [AllureStep("Reload current page")]
    public LoginPage ReloadPage()
    {
        Pw.Run(_page.ReloadAsync());
        return ShouldBeOpen();
    }

    [AllureStep("Login form panel is visible")]
    public ILocator LoginFormPanel() => LoginForm;

    [AllureStep("Verify form title message: {message}")]
    public LoginPage ShouldHaveFormTitle(string message)
    {
        Pw.Run(Assertions.Expect(FormTitle).ToContainTextAsync(message));
        return this;
    }

    [AllureStep("Verify error message: {message}")]
    public LoginPage ShouldHaveErrorMessage(string message)
    {
        Pw.Run(Assertions.Expect(ErrorMessage).ToContainTextAsync(message));
        return this;
    }
}
