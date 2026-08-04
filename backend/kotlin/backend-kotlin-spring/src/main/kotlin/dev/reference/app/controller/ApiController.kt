package dev.reference.app.controller

import dev.reference.app.dto.HealthResponse
import dev.reference.app.dto.ItemsResponse
import dev.reference.app.service.ItemService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class ApiController(
    private val itemService: ItemService,
) {
    @GetMapping("/health")
    fun health(): HealthResponse = itemService.health()

    @GetMapping("/items")
    fun items(): ItemsResponse = itemService.listItems()
}
