package dev.reference.app.controller

import dev.reference.app.config.CorsConfig
import dev.reference.app.config.SecurityConfig
import dev.reference.app.dto.AuthResponse
import dev.reference.app.dto.UserProfileResponse
import dev.reference.app.exception.AuthException
import dev.reference.app.service.AuthService
import dev.reference.app.service.JwtService
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(controllers = [AuthController::class])
@Import(AuthExceptionHandler::class, SecurityConfig::class, CorsConfig::class)
@DisplayName("AuthController")
class AuthControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockitoBean
    private lateinit var authService: AuthService

    @MockitoBean
    private lateinit var jwtService: JwtService

    @Test
    @DisplayName("POST /api/auth/register returns 201")
    fun registerReturnsCreated() {
        whenever(authService.register(any())).thenReturn(AuthResponse("jwt-token", "newuser", "/"))

        mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"username":"newuser","password":"password123"}"""),
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.token").value("jwt-token"))
            .andExpect(jsonPath("$.username").value("newuser"))
            .andExpect(jsonPath("$.redirectUrl").value("/"))
    }

    @Test
    @DisplayName("POST /api/auth/login returns 200")
    fun loginReturnsOk() {
        whenever(authService.login(any())).thenReturn(AuthResponse("jwt-token", "user1", "/"))

        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"username":"user1","password":"password1"}"""),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.token").value("jwt-token"))
            .andExpect(jsonPath("$.username").value("user1"))
    }

    @Test
    @DisplayName("POST /api/auth/logout returns 204")
    fun logoutReturnsNoContent() {
        mockMvc.perform(post("/api/auth/logout"))
            .andExpect(status().isNoContent)
    }

    @Test
    @DisplayName("GET /api/auth/me returns profile for authenticated user")
    fun meReturnsProfile() {
        whenever(authService.profile("user1")).thenReturn(UserProfileResponse("user1"))

        mockMvc.perform(
            get("/api/auth/me")
                .with(authentication(UsernamePasswordAuthenticationToken("user1", null, emptyList()))),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.username").value("user1"))

        verify(authService).profile("user1")
    }

    @Test
    @DisplayName("POST /api/auth/register maps duplicate username to 409")
    fun registerDuplicateUsername() {
        whenever(authService.register(any())).thenThrow(AuthException(409, "Username already taken"))

        mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"username":"user1","password":"password123"}"""),
        )
            .andExpect(status().isConflict)
            .andExpect(jsonPath("$.message").value("Username already taken"))
    }

    @Test
    @DisplayName("POST /api/auth/login maps invalid credentials to 401")
    fun loginInvalidCredentials() {
        whenever(authService.login(any())).thenThrow(AuthException(401, "Wrong login or password"))

        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"username":"user1","password":"wrong1"}"""),
        )
            .andExpect(status().isUnauthorized)
            .andExpect(jsonPath("$.message").value("Wrong login or password"))
    }

    @Test
    @DisplayName("GET /api/auth/me without token returns 401")
    fun meRequiresAuthentication() {
        mockMvc.perform(get("/api/auth/me"))
            .andExpect(status().isUnauthorized)
    }

    @Test
    @DisplayName("POST /api/auth/register rejects short password with 400")
    fun registerRejectsShortPassword() {
        mockMvc.perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"username":"shortuser","password":"abc"}"""),
        )
            .andExpect(status().isBadRequest)
    }
}
