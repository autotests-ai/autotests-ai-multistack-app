using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Api;
using Helpers;
using Tests;

namespace Tests.E2e;

[AllureLabel("layer", "e2e")]
[AllureEpic("Authentication")]
[AllureFeature("Register")]
[AllureSeverity(SeverityLevel.critical)]
[AllureSuite("Register")]
public sealed class RegisterTests : TestBase
{
    private const string LoginRequiredMessage = "Login is required (minimum 3 characters)";
    private const string LoginMinLengthMessage = "Login must be at least 3 characters";
    private const string PasswordRequiredMessage = "Password is required (minimum 6 characters)";
    private const string PasswordMismatchMessage = "Passwords do not match";
    private const string PasswordMinLengthMessage = "Password must be at least 6 characters";
    private const string BothRequiredMessage = "Login and password are required (minimum 3 and 6 characters)";
    private const string DuplicateUsernameMessage = "Username already taken";
    private const string RegisterPassword = "password123";

    private User? _registeredUser;

    public override void Dispose()
    {
        if (_registeredUser != null)
        {
            AuthApiClient.DeleteAccountQuietly(_registeredUser.Username, _registeredUser.Password);
            _registeredUser = null;
        }

        base.Dispose();
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "positive")]
    [Fact(DisplayName = "New user can register and land on home")]
    public void ShouldRegisterNewUser()
    {
        _registeredUser = new UserBuilder().WithUsername().WithPassword().Build();
        RegisterPage.OpenPage()
            .FillAndSubmitForm(
                _registeredUser.Username,
                _registeredUser.Password,
                _registeredUser.Password)
            .ShouldHaveWelcomeMessage(_registeredUser.WelcomeMessage());
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "positive")]
    [Fact(DisplayName = "New user can register with 3-character login and 6-character password")]
    public void ShouldRegisterWithMinimumLengthCredentials()
    {
        _registeredUser = new User(DataFaker.UsernameAtMinLength(), DataFaker.PasswordAtMinLength());
        RegisterPage.OpenPage()
            .FillAndSubmitForm(
                _registeredUser.Username,
                _registeredUser.Password,
                _registeredUser.Password)
            .ShouldHaveWelcomeMessage(_registeredUser.WelcomeMessage());
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Password mismatch shows validation error")]
    public void ShouldShowErrorWhenPasswordsDoNotMatch()
    {
        RegisterPage.OpenPage()
            .TypeUsername("newuser")
            .TypePassword("password123")
            .TypeConfirmPassword("password124")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(PasswordMismatchMessage);
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Short password on register shows validation error")]
    public void ShouldShowErrorWhenPasswordIsTooShort()
    {
        RegisterPage.OpenPage()
            .TypeUsername("newuser")
            .TypePassword("abc")
            .TypeConfirmPassword("abc")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(PasswordMinLengthMessage);
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Taken username on register shows readable error")]
    public void ShouldShowErrorWhenUsernameIsTaken()
    {
        RegisterPage.OpenPage()
            .TypeUsername("user1")
            .TypePassword(RegisterPassword)
            .TypeConfirmPassword(RegisterPassword)
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(DuplicateUsernameMessage);
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Short username on register shows validation error")]
    public void ShouldShowValidationErrorWhenUsernameIsTooShort()
    {
        RegisterPage.OpenPage()
            .TypeUsername("ab")
            .TypePassword("password123")
            .TypeConfirmPassword("password123")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(LoginMinLengthMessage);
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Empty username on register shows validation error")]
    public void ShouldShowValidationErrorWhenUsernameIsEmpty()
    {
        RegisterPage.OpenPage()
            .TypePassword("password123")
            .TypeConfirmPassword("password123")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(LoginRequiredMessage);
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Empty password on register shows validation error")]
    public void ShouldShowValidationErrorWhenPasswordIsEmpty()
    {
        RegisterPage.OpenPage()
            .TypeUsername("newuser")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(PasswordRequiredMessage);
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Empty username and password on register show combined validation error")]
    public void ShouldShowValidationErrorWhenCredentialsAreEmpty()
    {
        RegisterPage.OpenPage()
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(BothRequiredMessage);
    }
}
