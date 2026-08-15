package dev.multistack.app.service

import dev.multistack.app.dto.HealthResponse
import dev.multistack.app.dto.ItemDto
import dev.multistack.app.dto.ItemsResponse
import dev.multistack.app.repository.ItemRepository
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service

@Service
class ItemService(
    private val repository: ItemRepository,
) {
    fun health(): HealthResponse = HealthResponse("ok", SERVICE_NAME)

    fun listItems(): ItemsResponse {
        val items = repository.findAll(BY_ID).map { entity ->
            ItemDto(requireNotNull(entity.id), entity.name, entity.description)
        }
        return ItemsResponse(items, "postgresql")
    }

    companion object {
        /** Matches `health_service` for this module in `deploy/matrix.yaml`. */
        private const val SERVICE_NAME = "backend-kotlin-spring"

        private val BY_ID: Sort = Sort.by(Sort.Direction.ASC, "id")
    }
}
