using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Tests;

namespace Tests.E2e;

[AllureLabel("layer", "e2e")]
[AllureEpic("Authentication")]
[AllureFeature("Login")]
[AllureSeverity(SeverityLevel.critical)]
[AllureSuite("Login")]
public sealed class LoginTests : TestBase
{
    private const string LoginRequiredMessage = "Login is required (minimum 3 characters)";
    private const string LoginMinLengthMessage = "Login must be at least 3 characters";
    private const string PasswordRequiredMessage = "Password is required (minimum 6 characters)";
    private const string PasswordMinLengthMessage = "Password must be at least 6 characters";
    private const string BothRequiredMessage = "Login and password are required (minimum 3 and 6 characters)";
    private const string WrongCredentialsMessage = "Wrong login or password";

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "smoke")]
    [Trait("TestCategory", "positive")]
    [Fact(DisplayName = "User is logged in with valid credentials")]
    public void ShouldLoginWithValidCredentials()
    {
        LoginPage.OpenPage()
            .FillAndSubmitForm("user1", "password1")
            .ShouldHaveWelcomeMessage("Welcome, user1!");
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Empty username shows validation error")]
    public void ShouldShowValidationErrorWhenUsernameIsEmpty()
    {
        LoginPage.OpenPage()
            .TypePassword("password1")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(LoginRequiredMessage);
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Empty password shows validation error")]
    public void ShouldShowValidationErrorWhenPasswordIsEmpty()
    {
        LoginPage.OpenPage()
            .TypeUsername("user1")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(PasswordRequiredMessage);
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Wrong password shows readable error")]
    public void ShouldShowErrorWhenPasswordIsWrong()
    {
        LoginPage.OpenPage()
            .TypeUsername("user1")
            .TypePassword("wrongpassword")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(WrongCredentialsMessage);
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Short username shows validation error")]
    public void ShouldShowValidationErrorWhenUsernameIsTooShort()
    {
        LoginPage.OpenPage()
            .TypeUsername("ab")
            .TypePassword("password1")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(LoginMinLengthMessage);
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Short password shows validation error")]
    public void ShouldShowValidationErrorWhenPasswordIsTooShort()
    {
        LoginPage.OpenPage()
            .TypeUsername("user1")
            .TypePassword("123")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(PasswordMinLengthMessage);
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Unknown username shows the same readable error")]
    public void ShouldShowErrorWhenUsernameIsUnknown()
    {
        LoginPage.OpenPage()
            .TypeUsername("nouser")
            .TypePassword("password1")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(WrongCredentialsMessage);
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Empty username and password show combined validation error")]
    public void ShouldShowValidationErrorWhenCredentialsAreEmpty()
    {
        LoginPage.OpenPage()
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(BothRequiredMessage);
    }
}
