package api

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.networknt.schema.JsonSchemaFactory
import com.networknt.schema.SpecVersion
import org.junit.jupiter.api.Assertions.assertTrue

object JsonSchemas {

    private val mapper = ObjectMapper()
    private val factory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7)

    fun assertMatches(body: String, name: String) {
        val stream = checkNotNull(javaClass.getResourceAsStream("/schemas/$name")) {
            "missing classpath schema $name"
        }
        val schema = factory.getSchema(stream)
        val node = mapper.readTree(body)
        val errors = schema.validate(node)
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
