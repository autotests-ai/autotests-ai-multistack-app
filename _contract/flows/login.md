---
id: login-flow
version: 0.7
acceptance:
  - User opens login page
  - Empty login → validation error visible
  - Empty password → validation error visible
  - Credentials below field minimums → client-side form error (exact i18n literals in formValidation)
  - Client-side validation failure → form error shown, no API call made
  - Known user + wrong password of valid length → API 401, form error visible, no session created
  - Valid credentials → redirect to home (/)
  - User can register on /register
  - Valid register → 201, session created immediately, lands on home welcome (register is a login)
  - Duplicate username on register → API 409, form error verbatim, no session created
  - Logged-in user can logout → back to login, `authToken` cleared (client-side; the JWT is not revoked server-side)
  - Logged-in user can delete account after confirm → back to login, session cleared
  - Cancelling delete confirm keeps the session
  - Logged-in session survives a page reload (token read from localStorage)
  - Invalid or expired stored token → session cleared on home, welcome hidden
  - Auth controls expose id + name (Chrome autofill / Issues audit)

pages:
  home: /
  login: /login
  register: /register

api:
  login: POST /api/auth/login
  register: POST /api/auth/register
  logout: POST /api/auth/logout
  profile: GET /api/auth/me
  deleteAccount: DELETE /api/auth/me
  health: GET /api/health

storage:
  authToken: localStorage key `authToken`, scoped `authToken:<backendId>` under a matrix mount (authTokenStorageKey in appBase.ts); e2e shortcut allowed per RAG

# Form controls — SSOT for vanilla HTML, React PlaqueField, Vue PlaqueField.
# Every `input`/`select`/`textarea` must have `id` or `name` (prefer both).
# Auth `name` follows autocomplete tokens (not the testid string).
formControls:
  login:
    id: login-input
    name: username
    autocomplete: username
    testid: login-input
  password:
    id: password-input
    name: password
    autocomplete: current-password
    testid: password-input
  registerLogin:
    id: register-login-input
    name: username
    autocomplete: username
    testid: register-login-input
  registerPassword:
    id: register-password-input
    name: password
    autocomplete: new-password
    testid: register-password-input
  confirmPassword:
    id: confirm-password-input
    name: confirm-password
    autocomplete: new-password
    testid: confirm-password-input
  registerSubmit:
    id: register-submit-button
    testid: register-submit-button
  registerError:
    id: register-error-message
    testid: register-error-message
  headerSearch:
    id: header-search-input
    name: header-search
    testid: header-search-input
  headerMenuSearch:
    id: header-menu-search-input
    name: header-menu-search
    testid: header-menu-search-input

# Negative credentials — known user + wrong password of valid length.
# Layer split per docs/agent-skills/adr/009-login-401-is-api.md:
# 401 JSON is the api layer, the form text is e2e/component — never both in one test.
wrongPassword:
  preconditions:
    fixture: user1 / password1  # default seeded demo account — UserSeeder + app.seed.username/password (env SEED_USERNAME / SEED_PASSWORD; blank disables seeding)
    request: LoginRequest("user1", "wrongpassword")  # known user + wrong password; 13 chars ≥ MIN_PASSWORD_LENGTH=6 and @Size(min=6,max=128) → client + bean validation pass, the call reaches the API
    session: fresh — no prior successful login; no `authToken`/`authToken:<backendId>` in localStorage before submit
  api:
    endpoint: POST /api/auth/login
    status: 401
    body: '{"message": "Wrong login or password"}'  # envelope schemas/error.json — {message} only, no extra fields
    unknownUser: an unknown username gets the same status 401 and the same body
    ownedBy: tests/api — AuthApiTests#loginWithInvalidPassword · loginWithUnknownUsername · loginMinLengthUnknownUserIsUnauthorized
  form:
    testid: error-message     # p#error-message, aria-live="polite"
    text: API `message` verbatim — shown in any UI lang
    fallback:                 # resolveAuthErrorMessage order (auth.ts)
      - err.network → i18n `errorNetwork`
      - non-empty err.message → verbatim — apiRequest uses body.message when a string, else 'Request failed'
      - empty/missing err.message → i18n `errorWrongCredentials` — e.g. an empty-string body.message
    ownedBy: tests/e2e — LoginTests#shouldShowErrorWhenPasswordIsWrong (submitExpectingError) · component LoginPage.test.tsx
    goldenId: login-wrong-password-e2e  # the form story, not the 401
  session:
    authToken: absent — saveSession runs only after a 2xx (storage key `authToken`, or `authToken:<backendId>` under a matrix mount)
    redirect: none — stays on /login; getToken() finds no token, so no auto-redirect on remount
  stub:
    mockStand: deploy/mock/mappings/auth-login.json answers 200 to ANY POST /api/auth/login — no 401 mapping exists
    implication: a stubbed browser test lands in tests/ui and cannot cover wrong password today — it would need a new mapping
  prohibited:
    - browser test asserting an HTTP status or reading raw JSON ($("pre")) — ADR 009

# Field bounds — identical constraints on LoginRequest and RegisterRequest records.
# Client validates the minimum only; the API enforces min+max via bean validation.
bounds:
  username: {min: 3, max: 64}   # @NotBlank @Size — backend dto/LoginRequest.java + dto/RegisterRequest.java
  password: {min: 6, max: 128}
  client: min only — MIN_LOGIN_LENGTH=3 / MIN_PASSWORD_LENGTH=6 (frontend auth.ts — react src/lib/auth.ts, mirrored in every frontend cell); no client max — oversized input reaches the API and its 400 message is shown verbatim
  edge: exactly-min credentials are VALID, not an error — tests/api AuthApiTests#registerAcceptsMinimumLengthCredentials · tests/e2e LoginTests#shouldLoginWithMinimumLengthCredentials / RegisterTests#shouldRegisterWithMinimumLengthCredentials

# Client-side form validation — exact i18n literals the e2e constants assert.
# resolveAuthErrorMessage (auth.ts) passes a non-empty API body.message through verbatim in any UI lang.
formValidation:
  order:                        # first failing rule wins — validateCredentials in auth.ts; values are .trim()'ed first
    - both empty → errorBothRequired
    - login empty → errorLoginRequired
    - login below min → errorLoginMinLength
    - password empty → errorPasswordRequired
    - password below min → errorPasswordMinLength
    - 'register only: password != confirm → errorPasswordMismatch'  # checked after all of the above (RegisterPage.tsx)
  confirm: register only — confirmPassword is .trim()'ed like the rest (RegisterPage.tsx); the mismatch check runs after validateCredentials, so an empty or whitespace confirm with a valid password → errorPasswordMismatch
  en:                           # i18n/en.ts auth + register blocks, {minLogin}=3 {minPassword}=6 — same dictionary copied into every frontend cell
    errorBothRequired: 'Login and password are required (minimum 3 and 6 characters)'
    errorLoginRequired: 'Login is required (minimum 3 characters)'
    errorLoginMinLength: 'Login must be at least 3 characters'
    errorPasswordRequired: 'Password is required (minimum 6 characters)'
    errorPasswordMinLength: 'Password must be at least 6 characters'
    errorPasswordMismatch: 'Passwords do not match'
    errorNetwork: 'Network error. Check your connection and try again.'
  ru:                           # i18n/ru.ts — same keys
    errorBothRequired: 'Нужны логин и пароль (минимум 3 и 6 символов)'
    errorLoginRequired: 'Логин обязателен (минимум 3 символов)'
    errorLoginMinLength: 'Логин должен быть не короче 3 символов'
    errorPasswordRequired: 'Пароль обязателен (минимум 6 символов)'
    errorPasswordMinLength: 'Пароль должен быть не короче 6 символов'
    errorPasswordMismatch: 'Пароли не совпадают'
    errorNetwork: 'Ошибка сети. Проверьте соединение и попробуйте снова.'
  apiPassthrough: a non-empty API body.message is shown verbatim in any lang — 'Username already taken' (409), 'Wrong login or password' (401); empty/missing message → i18n fallback — errorRegistrationFailed 'Registration failed' / 'Регистрация не удалась' (register) or errorWrongCredentials 'Wrong login or password' / 'Неверный логин или пароль' (login)
  noApiCall: client-side failures — required, min-length, mismatch — show the error without any API request; handleSubmit returns before apiRequest (LoginPage.tsx / RegisterPage.tsx) — a local literal differs from apiPassthrough by the absent call
  shown: single error node — login `#error-message`, register `#register-error-message`; p element, aria-live="polite"
  lang: UI lang = localStorage `zds-lang` (en|ru), default en (i18n/index.ts) — e2e asserts the en literals; ru e2e hook — `localStorage.setItem('zds-lang','ru')` on a same-origin page before open (lang is read once at mount — useI18n/readStoredLang); live switch — `header:lang-change` document event
  ownedBy: tests/e2e — LoginTests + RegisterTests string constants · component LoginPage.test.tsx / RegisterPage.test.tsx

# Bean-validation envelope — @Valid on the request record; NOT an AuthException, never 401.
beanValidation:
  status: 400
  body: '{"message": "<field> <constraint default message>[; <next-field> <default message>]"}'  # AuthExceptionHandler#handleValidationException — envelope schemas/error.json
  defaults:                     # Hibernate Validator literals for the two annotations in use
    NotBlank: 'must not be blank'
    Size: 'size must be between {min} and {max}'   # e.g. short password → "password size must be between 6 and 128"
  join: several field errors land in one message joined by "; " in field order — empty creds → 'username must not be blank; password must not be blank'
  malformedJson: '{"message": "Request body is not valid JSON"}'  # HttpMessageNotReadableException → 400, not 401
  ownedBy: tests/api — AuthApiTests#loginRejects* / registerRejects* (status 400 + field name in message · "; " join · malformed literal)

# Register — full flow contract (was acceptance-only before 0.5).
register:
  positive:
    api: 'POST /api/auth/register → 201, body AuthResponse {token, username, redirectUrl: "/"} — schemas/auth-response.json'
    session: saveSession(response.token) — register IS a login; `authToken` written right after the 201 (RegisterPage.tsx)
    redirect: navigate(response.redirectUrl || '/') → home welcome, same as validLogin.home
    ownedBy: tests/api AuthApiTests#registerNewUser · tests/e2e RegisterTests#shouldRegisterNewUser / shouldRegisterWithMinimumLengthCredentials
  duplicate:
    api: 'existing username → 409 {"message": "Username already taken"} — AuthService.register (existsByUsername + DataIntegrityViolationException race path); envelope schemas/error.json'
    form: the 409 message shown verbatim in `#register-error-message`, any lang (formValidation.apiPassthrough)
    session: no `authToken` written; stays on /register
    ownedBy: tests/api AuthApiTests#registerDuplicateUsername · tests/e2e RegisterTests#shouldShowErrorWhenUsernameIsTaken
  stub:
    mockStand: deploy/mock/mappings/auth-register.json answers 201 to ANY POST /api/auth/register — no 409 mapping exists
    implication: a stubbed register-positive lands in tests/ui; duplicate cannot be covered on the mock stand without a new mapping
  prohibited:
    - browser test asserting an HTTP status or reading raw JSON — ADR 009, same as wrongPassword

# Positive login — the session is written only after a 2xx.
validLogin:
  api: 'POST /api/auth/login → 200, body AuthResponse {token, username, redirectUrl: "/"} — schemas/auth-response.json'
  session: saveSession(response.token) → localStorage `authToken` (or `authToken:<backendId>` under a matrix mount) — runs only after the 2xx (LoginPage.tsx)
  home:
    redirect: navigate(response.redirectUrl || '/') — lands on /
    welcome: welcome-panel unhidden, `#welcome-message` = 'Welcome, {username}!' (en) / 'Добро пожаловать, {username}!' (ru) — the username comes from GET /api/auth/me with the fresh Bearer token, not from the login body (HomePage.tsx)
    degraded: /me failure → clearSession() → welcome-panel stays hidden
  ownedBy: tests/api AuthApiTests#loginWithValidCredentials · tests/e2e LoginTests#shouldLoginWithValidCredentials ('Welcome, user1!')

# Session lifecycle — one place for when `authToken` is written, read and cleared.
session:
  transport: Bearer JWT in `Authorization` — backend STATELESS (SecurityConfig), no cookie session, CSRF off; clearing cookies does not end a session (CorsConfig, SecurityConfig)
  storage: localStorage only — key from `storage.authToken`; e2e derives it from the pathname (BasePage AUTH_TOKEN_KEY_JS)
  lifetime: JWT exp = auth.jwt.expiration-ms (default 86400000 = 24h, env JWT_EXPIRATION_MS) — JwtService
  write: saveSession(response.token) only after a 2xx login (validLogin.session) or 201 register (register.positive.session) — async, after the response resolves; never on 4xx
  read:
    login: getToken() on mount → navigate('/', replace) — a stored token skips the form (LoginPage.tsx)
    home: getToken() → GET /api/auth/me with Bearer → welcome (validLogin.home)
    reload: session survives a reload — the token stays in localStorage and home re-reads it
  clear:
    logout: auth.ts logout() fires POST /api/auth/logout without awaiting it, then removeItem(authToken); HomePage navigates to /login (replace)
    deleteAccount: auth.ts deleteAccount() awaits DELETE /api/auth/me, then removeItem(authToken) even if the call failed; HomePage navigates to /login only after window.confirm
    invalidToken: /me failure on home → clearSession(), welcome-panel stays hidden (validLogin.home.degraded)
  logout:
    api: 'POST /api/auth/logout → 204, empty body — permitAll, no server state (AuthController)'
    tokenAfter: still valid server-side until exp — GET /api/auth/me with the same token → 200; by design, not a bug
  deleteAccount:
    api: 'DELETE /api/auth/me (Bearer) → 204; no/invalid token → 401'
    tokenAfter: still verifies cryptographically, but the row is gone → GET /api/auth/me and DELETE /api/auth/me → 401 (AuthService.deleteAccount)
    cancel: window.confirm false → no request, token kept
  e2eShortcut:
    method: BasePage.openPageWithLocalStorageAuthentication — API login, setItem(authToken) on a static same-origin asset, then open the page
    scope: precondition only; it does not test the login form, and its token write is synchronous (no async race)
    reset: BrowserSessionHelper.resetPageState clears local/session storage and cookies — a hook, not an assertion of "no session"
  ownedBy: tests/api AuthRoundTripApiTests#accountLifecycleRoundTrip · tests/e2e SessionTests#sessionSurvivesReload / invalidTokenClearsSession · LogoutTests · DeleteAccountTests · component test/lib/auth.test.ts (logout clears token even when the API call fails or hangs)

implementation:
  canon: projects/autotests-ai-multistack-home/autotests-ai-multistack-app/
  frontend: projects/autotests-ai-multistack-home/autotests-ai-multistack-app/frontend/typescript/frontend-typescript-react/
  react: projects/autotests-ai-multistack-home/autotests-ai-multistack-app/frontend/typescript/frontend-typescript-react/
  tests: projects/autotests-ai-multistack-home/autotests-ai-multistack-app/tests/java/tests-java-junit5-rest_assured-selenide/
  # Native cells — same flow, same testids, no note screen. See ../native-shell.md.
  android: projects/autotests-ai-multistack-home/autotests-ai-multistack-app/mobile/kotlin/mobile-kotlin-compose/
  ios: projects/autotests-ai-multistack-home/autotests-ai-multistack-app/mobile/swift/mobile-swift-swiftui/

design-system:
  embedHeader: true
  reference: projects/autotests-ai-multistack-home/autotests-ai-multistack-app/frontend/typescript/frontend-typescript-react/src/pages/LoginPage.tsx
  uiSource: design-system/  # wire via scripts/wire-ui.sh (render.sh calls automatically)
  plaqueField: projects/design-system-home/react-ui/src/PlaqueField.tsx  # defaults name←paramId←id
  templates: design-system/templates/plaque-field.html
