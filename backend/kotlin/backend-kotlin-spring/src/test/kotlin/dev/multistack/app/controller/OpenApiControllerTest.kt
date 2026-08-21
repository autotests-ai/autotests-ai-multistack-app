package dev.multistack.app.controller

import dev.multistack.app.config.CorsConfig
import dev.multistack.app.config.SecurityConfig
import dev.multistack.app.service.JwtService
import org.hamcrest.Matchers.containsString
import org.junit.jupiter.api.Assertions.assertArrayEquals
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.nio.file.Files
import java.nio.file.Path

@WebMvcTest(controllers = [OpenApiController::class])
@Import(SecurityConfig::class, CorsConfig::class)
@DisplayName("OpenApiController")
class OpenApiControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockitoBean
    private lateinit var jwtService: JwtService

    @Test
    @DisplayName("GET /api/openapi.yaml is the classpath copy of _contract/openapi.yaml")
    fun specMatchesContractCopy() {
        val expected = Files.readAllBytes(Path.of("src/main/resources/openapi.yaml"))
        val ssot = Files.readAllBytes(Path.of("../../../_contract/openapi.yaml"))
        assertArrayEquals(ssot, expected)

        val body = mockMvc.perform(get("/api/openapi.yaml"))
            .andExpect(status().isOk)
            .andExpect(content().contentType("application/yaml"))
            .andReturn()
            .response
            .contentAsByteArray
        assertArrayEquals(expected, body)
    }

    @Test
    @DisplayName("GET /api/docs is Swagger UI pointed at ./openapi.yaml")
    fun docsServesSwaggerUi() {
        mockMvc.perform(get("/api/docs"))
            .andExpect(status().isOk)
            .andExpect(content().contentTypeCompatibleWith("text/html"))
            .andExpect(content().string(containsString("SwaggerUIBundle")))
            .andExpect(content().string(containsString("./openapi.yaml")))
    }
}
