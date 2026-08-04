package dev.reference.app.config

import dev.reference.app.service.JwtService
import jakarta.servlet.FilterChain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.http.HttpHeaders
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder

@ExtendWith(MockitoExtension::class)
@DisplayName("JwtAuthFilter")
class JwtAuthFilterTest {
    @Mock
    private lateinit var jwtService: JwtService

    @Mock
    private lateinit var filterChain: FilterChain

    private lateinit var filter: JwtAuthFilter

    @BeforeEach
    fun setUp() {
        filter = JwtAuthFilter(jwtService)
    }

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
    }

    @Test
    @DisplayName("passes through when Authorization header is missing")
    fun passesThroughWithoutAuthorizationHeader() {
        val request = MockHttpServletRequest()
        val response = MockHttpServletResponse()

        filter.doFilterInternal(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        assertNull(SecurityContextHolder.getContext().authentication)
    }

    @Test
    @DisplayName("ignores invalid bearer token")
    fun ignoresInvalidBearerToken() {
        val request = MockHttpServletRequest()
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer invalid-token")
        val response = MockHttpServletResponse()
        `when`(jwtService.isValid("invalid-token")).thenReturn(false)

        filter.doFilterInternal(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        assertNull(SecurityContextHolder.getContext().authentication)
    }

    @Test
    @DisplayName("ignores non-bearer authorization header")
    fun ignoresNonBearerAuthorizationHeader() {
        val request = MockHttpServletRequest()
        request.addHeader(HttpHeaders.AUTHORIZATION, "Basic dXNlcjpwYXNz")
        val response = MockHttpServletResponse()

        filter.doFilterInternal(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        assertNull(SecurityContextHolder.getContext().authentication)
    }

    @Test
    @DisplayName("sets authentication for valid bearer token")
    fun setsAuthenticationForValidBearerToken() {
        val request = MockHttpServletRequest()
        request.requestURI = "/api/auth/me"
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
        val response = MockHttpServletResponse()
        `when`(jwtService.isValid("valid-token")).thenReturn(true)
        `when`(jwtService.extractUsername("valid-token")).thenReturn("user1")

        filter.doFilterInternal(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        val authentication = SecurityContextHolder.getContext().authentication
        assertEquals("user1", authentication.principal)
        assertEquals("user1", authentication.name)
    }
}
