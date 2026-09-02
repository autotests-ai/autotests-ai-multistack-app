using Allure.Net.Commons;
using Allure.NUnit.Attributes;
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

    [TearDown]
    public void CleanupRegisteredUser()
    {
        if (_registeredUser != null)
        {
            AuthApiClient.DeleteAccountQuietly(_registeredUser.Username, _registeredUser.Password);
            _registeredUser = null;
        }
    }

    [Test]
    [Category("e2e")]
    [Category("positive")]
    [AllureName("New user can register and land on home")]
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

    [Test]
    [Category("e2e")]
    [Category("negative")]
    [AllureName("Password mismatch shows validation error")]
    public void ShouldShowErrorWhenPasswordsDoNotMatch()
    {
        RegisterPage.OpenPage()
            .TypeUsername("newuser")
            .TypePassword("password123")
            .TypeConfirmPassword("password124")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(PasswordMismatchMessage);
    }

    [Test]
    [Category("e2e")]
    [Category("negative")]
    [AllureName("Short password shows validation error")]
    public void ShouldShowErrorWhenPasswordIsTooShort()
    {
        RegisterPage.OpenPage()
            .TypeUsername("newuser")
            .TypePassword("abc")
            .TypeConfirmPassword("abc")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(PasswordMinLengthMessage);
    }

    [Test]
    [Category("e2e")]
    [Category("negative")]
    [AllureName("Duplicate username shows readable error")]
    public void ShouldShowErrorWhenUsernameIsTaken()
    {
        RegisterPage.OpenPage()
            .TypeUsername("user1")
            .TypePassword(RegisterPassword)
            .TypeConfirmPassword(RegisterPassword)
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(DuplicateUsernameMessage);
    }

    [Test]
    [Category("e2e")]
    [Category("negative")]
    [AllureName("Short username shows validation error")]
    public void ShouldShowValidationErrorWhenUsernameIsTooShort()
    {
        RegisterPage.OpenPage()
            .TypeUsername("ab")
            .TypePassword("password123")
            .TypeConfirmPassword("password123")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(LoginMinLengthMessage);
    }

    [Test]
    [Category("e2e")]
    [Category("negative")]
    [AllureName("Empty username shows validation error")]
    public void ShouldShowValidationErrorWhenUsernameIsEmpty()
    {
        RegisterPage.OpenPage()
            .TypePassword("password123")
            .TypeConfirmPassword("password123")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(LoginRequiredMessage);
    }

    [Test]
    [Category("e2e")]
    [Category("negative")]
    [AllureName("Empty password shows validation error")]
    public void ShouldShowValidationErrorWhenPasswordIsEmpty()
    {
        RegisterPage.OpenPage()
            .TypeUsername("newuser")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(PasswordRequiredMessage);
    }

    [Test]
    [Category("e2e")]
    [Category("negative")]
    [AllureName("Empty username and password show validation error")]
    public void ShouldShowValidationErrorWhenCredentialsAreEmpty()
    {
        RegisterPage.OpenPage()
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(BothRequiredMessage);
    }
}
