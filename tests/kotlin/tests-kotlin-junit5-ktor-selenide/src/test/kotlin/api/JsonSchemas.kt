package api

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.networknt.schema.InputFormat
import com.networknt.schema.SchemaRegistry
import com.networknt.schema.SpecificationVersion
import org.junit.jupiter.api.Assertions.assertTrue

object JsonSchemas {

    private val registry = SchemaRegistry.withDefaultDialect(SpecificationVersion.DRAFT_7)

    fun assertMatches(body: String, name: String) {
        val stream = checkNotNull(javaClass.getResourceAsStream("/schemas/$name")) {
            "missing classpath schema $name"
        }
        val errors = registry.getSchema(stream).validate(body, InputFormat.JSON)
        assertTrue(errors.isEmpty()) {
            "$name: ${errors.joinToString("; ") { it.message }} — $body"
        }
    }
}

data class HttpResult(val status: Int, val body: String) {
    val json: JsonNode by lazy { MAPPER.readTree(body.ifBlank { "{}" }) }

    fun text(field: String): String = json.path(field).asText()

    fun itemNames(): List<String> =
        json.path("items").map { it.path("name").asText() }

    companion object {
        val MAPPER: ObjectMapper = ObjectMapper()
    }
}
