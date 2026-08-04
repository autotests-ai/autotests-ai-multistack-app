package dev.reference.app.controller

import dev.reference.app.config.CorsConfig
import dev.reference.app.config.SecurityConfig
import dev.reference.app.dto.HealthResponse
import dev.reference.app.dto.ItemDto
import dev.reference.app.dto.ItemsResponse
import dev.reference.app.service.ItemService
import dev.reference.app.service.JwtService
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(controllers = [ApiController::class])
@Import(SecurityConfig::class, CorsConfig::class)
@DisplayName("ApiController")
class ApiControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockitoBean
    private lateinit var itemService: ItemService

    @MockitoBean
    private lateinit var jwtService: JwtService

    @Test
    @DisplayName("GET /api/health returns ok")
    fun healthReturnsOk() {
        `when`(itemService.health()).thenReturn(HealthResponse("ok", "backend-kotlin-spring"))

        mockMvc.perform(get("/api/health"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("ok"))
            .andExpect(jsonPath("$.service").value("backend-kotlin-spring"))
    }

    @Test
    @DisplayName("GET /api/items returns items from service")
    fun itemsReturnsList() {
        `when`(itemService.listItems()).thenReturn(
            ItemsResponse(
                listOf(ItemDto(1L, "Alpha", "First item")),
                "postgresql",
            ),
        )

        mockMvc.perform(get("/api/items"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.source").value("postgresql"))
            .andExpect(jsonPath("$.items[0].name").value("Alpha"))
            .andExpect(jsonPath("$.items[0].description").value("First item"))
    }
}
