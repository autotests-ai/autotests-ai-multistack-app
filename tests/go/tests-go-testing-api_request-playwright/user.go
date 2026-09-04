package tests

type User struct {
	Username string
	Password string
}

func (u User) WelcomeMessage() string {
	return "Welcome, " + u.Username + "!"
}

func NewUser() User {
	return User{Username: Username(), Password: "password123"}
}

func NewUserAtMinLength() User {
	return User{Username: UsernameAtMinLength(), Password: PasswordAtMinLength()}
}
