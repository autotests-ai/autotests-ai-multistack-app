package dev.multistack.app.routes

import dev.multistack.app.appModule
import dev.multistack.app.support.TestApp
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import java.util.UUID

/** Whole auth surface over a real H2-backed service — the contract questions, in-process. */
@DisplayName("AuthRoutes")
class AuthRoutesTest {

    @Test
    @DisplayName("register → login → me → logout (stateless token) → delete → me is 401")
    fun accountLifecycle() = testApplication {
        application { appModule(TestApp.freshDependencies()) }
        val username = "it_" + UUID.randomUUID().toString().substring(0, 8)

        val register = client.post("/api/auth/register") {
            contentType(ContentType.Application.Json)
            setBody("""{"username":"$username","password":"password123"}""")
        }
        assertEquals(HttpStatusCode.Created, register.status)
        val registerBody = Json.parseToJsonElement(register.bodyAsText()).jsonObject
        assertEquals(username, registerBody["username"]!!.jsonPrimitive.content)
        assertEquals("/", registerBody["redirectUrl"]!!.jsonPrimitive.content)
        assertTrue(registerBody["token"]!!.jsonPrimitive.content.isNotEmpty())

        val login = client.post("/api/auth/login") {
            contentType(ContentType.Application.Json)
            setBody("""{"username":"$username","password":"password123"}""")
        }
        assertEquals(HttpStatusCode.OK, login.status)
        val token = Json.parseToJsonElement(login.bodyAsText())
            .jsonObject["token"]!!.jsonPrimitive.content

        val me = client.get("/api/auth/me") {
            header(HttpHeaders.Authorization, "Bearer $token")
        }
        assertEquals(HttpStatusCode.OK, me.status)
        assertEquals(
            username,
            Json.parseToJsonElement(me.bodyAsText()).jsonObject["username"]!!.jsonPrimitive.content,
        )

        val logout = client.post("/api/auth/logout")
        assertEquals(HttpStatusCode.NoContent, logout.status)

        val delete = client.delete("/api/auth/me") {
            header(HttpHeaders.Authorization, "Bearer $token")
        }
        assertEquals(HttpStatusCode.NoContent, delete.status)

        val meAfterDelete = client.get("/api/auth/me") {
            header(HttpHeaders.Authorization, "Bearer $token")
        }
        assertEquals(HttpStatusCode.Unauthorized, meAfterDelete.status)
    }

    @Test
    @DisplayName("login with seed user1/password1 issues a token")
    fun seedUserLogsIn() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val login = client.post("/api/auth/login") {
            contentType(ContentType.Application.Json)
            setBody("""{"username":"user1","password":"password1"}""")
        }

        assertEquals(HttpStatusCode.OK, login.status)
        assertNotNull(Json.parseToJsonElement(login.bodyAsText()).jsonObject["token"])
    }

    @Test
    @DisplayName("register of a taken username answers 409 + envelope")
    fun registerConflict() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val response = client.post("/api/auth/register") {
            contentType(ContentType.Application.Json)
            setBody("""{"username":"user1","password":"password123"}""")
        }

        assertEquals(HttpStatusCode.Conflict, response.status)
        assertEquals(
            "Username already taken",
            Json.parseToJsonElement(response.bodyAsText())
                .jsonObject["message"]!!.jsonPrimitive.content,
        )
    }

    @Test
    @DisplayName("login with a wrong password answers 401 + envelope")
    fun loginWrongPassword() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val response = client.post("/api/auth/login") {
            contentType(ContentType.Application.Json)
            setBody("""{"username":"user1","password":"wrongpass"}""")
        }

        assertEquals(HttpStatusCode.Unauthorized, response.status)
        assertEquals(
            "Wrong login or password",
            Json.parseToJsonElement(response.bodyAsText())
                .jsonObject["message"]!!.jsonPrimitive.content,
        )
    }

    @Test
    @DisplayName("register joins both field errors into one 400 message")
    fun registerJoinsFieldErrors() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val response = client.post("/api/auth/register") {
            contentType(ContentType.Application.Json)
            setBody("""{"username":"","password":""}""")
        }

        assertEquals(HttpStatusCode.BadRequest, response.status)
        val message = Json.parseToJsonElement(response.bodyAsText())
            .jsonObject["message"]!!.jsonPrimitive.content
        assertTrue(message.contains("username"), message)
        assertTrue(message.contains("password"), message)
        assertTrue(message.contains("; "), message)
    }

    @Test
    @DisplayName("login answers a malformed JSON body with 400, not 401")
    fun loginRejectsMalformedJson() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val response = client.post("/api/auth/login") {
            contentType(ContentType.Application.Json)
            setBody("not json")
        }

        assertEquals(HttpStatusCode.BadRequest, response.status)
        assertEquals(
            "Request body is not valid JSON",
            Json.parseToJsonElement(response.bodyAsText())
                .jsonObject["message"]!!.jsonPrimitive.content,
        )
    }

    @Test
    @DisplayName("register rejects a short password with 400")
    fun registerRejectsShortPassword() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val response = client.post("/api/auth/register") {
            contentType(ContentType.Application.Json)
            setBody("""{"username":"shortuser","password":"abc"}""")
        }

        assertEquals(HttpStatusCode.BadRequest, response.status)
        val message = Json.parseToJsonElement(response.bodyAsText())
            .jsonObject["message"]!!.jsonPrimitive.content
        assertTrue(message.contains("password"), message)
    }

    @Test
    @DisplayName("GET /api/auth/me without a token answers 401")
    fun meWithoutToken() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val response = client.get("/api/auth/me")

        assertEquals(HttpStatusCode.Unauthorized, response.status)
    }

    @Test
    @DisplayName("GET /api/auth/me with a garbage token answers 401")
    fun meWithGarbageToken() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val response = client.get("/api/auth/me") {
            header(HttpHeaders.Authorization, "Bearer garbage")
        }

        assertEquals(HttpStatusCode.Unauthorized, response.status)
    }

    @Test
    @DisplayName("DELETE /api/auth/me without a token answers 401")
    fun deleteWithoutToken() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val response = client.delete("/api/auth/me")

        assertEquals(HttpStatusCode.Unauthorized, response.status)
    }
}
