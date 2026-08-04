package dev.reference.app.service

import dev.reference.app.dto.HealthResponse
import dev.reference.app.dto.ItemDto
import dev.reference.app.dto.ItemsResponse
import dev.reference.app.repository.ItemRepository
import org.springframework.stereotype.Service

@Service
class ItemService(
    private val repository: ItemRepository,
) {
    fun health(): HealthResponse = HealthResponse("ok", "backend-kotlin-spring")

    fun listItems(): ItemsResponse {
        val items = repository.findAll().map { entity ->
            ItemDto(requireNotNull(entity.id), entity.name, entity.description)
        }
        return ItemsResponse(items, "postgresql")
    }
}
