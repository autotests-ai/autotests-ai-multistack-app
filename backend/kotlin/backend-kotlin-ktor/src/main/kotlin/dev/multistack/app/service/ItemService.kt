package dev.multistack.app.service

import dev.multistack.app.config.AppConfig
import dev.multistack.app.db.ItemRepository
import dev.multistack.app.dto.HealthResponse
import dev.multistack.app.dto.ItemsResponse

class ItemService(
    private val repository: ItemRepository,
) {
    fun health(): HealthResponse = HealthResponse("ok", AppConfig.SERVICE_NAME)

    fun listItems(): ItemsResponse = ItemsResponse(repository.findAll(), "postgresql")
}
