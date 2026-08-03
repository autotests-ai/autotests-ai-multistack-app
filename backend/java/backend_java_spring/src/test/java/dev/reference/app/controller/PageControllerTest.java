package dev.reference.app.controller;

import dev.reference.app.config.CorsConfig;
import dev.reference.app.config.SecurityConfig;
import dev.reference.app.service.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PageController.class)
@Import({SecurityConfig.class, CorsConfig.class})
@DisplayName("PageController")
class PageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @Test
    @DisplayName("GET /login forwards to login.html when MPA file exists")
    void loginForwardsToLoginHtmlWhenPresent() throws Exception {
        mockMvc.perform(get("/login"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/login.html"));
    }

    @Test
    @DisplayName("GET /register forwards to register.html when MPA file exists")
    void registerForwardsToRegisterHtmlWhenPresent() throws Exception {
        mockMvc.perform(get("/register"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/register.html"));
    }

    @Test
    @DisplayName("GET /dashboard forwards to index.html for SPA client routes")
    void unknownRouteForwardsToIndexHtml() throws Exception {
        mockMvc.perform(get("/dashboard"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    @DisplayName("GET /api is not treated as a client route")
    void apiSegmentIsNotForwarded() throws Exception {
        mockMvc.perform(get("/api"))
                .andExpect(status().isNotFound());
    }
}
