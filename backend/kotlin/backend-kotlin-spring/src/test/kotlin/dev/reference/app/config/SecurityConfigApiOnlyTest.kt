package dev.reference.app.config

import dev.reference.app.controller.ApiController
import dev.reference.app.service.ItemService
import dev.reference.app.service.JwtService
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(controllers = [ApiController::class])
@Import(SecurityConfig::class, CorsConfig::class)
@DisplayName("SecurityConfig API-only")
class SecurityConfigApiOnlyTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockitoBean
    private lateinit var itemService: ItemService

    @MockitoBean
    private lateinit var jwtService: JwtService

    @Test
    @DisplayName("non-API paths are denied")
    fun nonApiDenied() {
        mockMvc.perform(get("/login")).andExpect(status().isUnauthorized)
    }
}
