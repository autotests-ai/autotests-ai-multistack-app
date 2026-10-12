---
id: login-flow
version: 0.4
acceptance:
  - User opens login page
  - Empty login → validation error visible
  - Empty password → validation error visible
  - Known user + wrong password of valid length → API 401, form error visible, no session created
  - Valid credentials → redirect to home (/)
  - User can register on /register
  - Logged-in user can logout → back to login
  - Logged-in user can delete account after confirm → back to login, session cleared
  - Cancelling delete confirm keeps the session
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
