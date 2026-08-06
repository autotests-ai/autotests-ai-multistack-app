package dev.reference.app.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.reference.app.controller.ApiController;
import dev.reference.app.service.ItemService;
import dev.reference.app.service.JwtService;
import dev.reference.app.allure.UnitTestBase;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@Epic("Security")
@Feature("API-only security")
@Severity(SeverityLevel.CRITICAL)
@WebMvcTest(controllers = ApiController.class)
@Import({SecurityConfig.class, CorsConfig.class})
@DisplayName("SecurityConfig API-only")
class SecurityConfigApiOnlyTest extends UnitTestBase {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ItemService itemService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    @DisplayName("non-API paths are denied")
    void nonApiDenied() throws Exception {
        mockMvc.perform(get("/login")).andExpect(status().isUnauthorized());
    }
}
