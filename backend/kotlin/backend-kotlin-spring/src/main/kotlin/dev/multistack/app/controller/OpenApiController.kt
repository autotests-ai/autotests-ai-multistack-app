package dev.multistack.app.controller

import org.springframework.core.io.ClassPathResource
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Serves the shared contract (`_contract/openapi.yaml` copied into the classpath)
 * and a Swagger UI that points at that file. Not springdoc — the yaml is SSOT.
 */
@RestController
@RequestMapping("/api")
class OpenApiController {

    @GetMapping("/openapi.yaml")
    fun spec(): ResponseEntity<ByteArray> =
        ResponseEntity.ok().contentType(YAML).body(read("openapi.yaml"))

    @GetMapping("/docs", produces = [MediaType.TEXT_HTML_VALUE])
    fun docs(): ResponseEntity<ByteArray> =
        ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(read("openapi-docs.html"))

    private fun read(name: String): ByteArray = ClassPathResource(name).contentAsByteArray

    companion object {
        private val YAML = MediaType.parseMediaType("application/yaml")
    }
}
