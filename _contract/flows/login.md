---
id: login-flow
version: 0.3
acceptance:
  - User opens login page
  - Empty login → validation error visible
  - Empty password → validation error visible
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
  authToken: localStorage key `authToken` (e2e shortcut allowed per RAG)

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

implementation:
  canon: projects/autotests-ai-multistack-home/autotests-ai-multistack-app/
  frontend: projects/autotests-ai-multistack-home/autotests-ai-multistack-app/frontend/typescript/frontend-typescript-react/
  react: projects/autotests-ai-multistack-home/autotests-ai-multistack-app/frontend/typescript/frontend-typescript-react/
  tests: projects/autotests-ai-multistack-home/autotests-ai-multistack-app/tests/java/tests-java-junit5-rest_assured-selenide/

design-system:
  embedHeader: true
  reference: projects/autotests-ai-multistack-home/autotests-ai-multistack-app/frontend/typescript/frontend-typescript-react/src/pages/LoginPage.tsx
  uiSource: design-system/  # wire via scripts/wire-ui.sh (render.sh calls automatically)
  plaqueField: projects/design-system-home/react-ui/src/PlaqueField.tsx  # defaults name←paramId←id
  templates: design-system/templates/plaque-field.html
