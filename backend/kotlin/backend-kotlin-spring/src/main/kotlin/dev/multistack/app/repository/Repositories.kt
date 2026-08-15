package dev.multistack.app.repository

import dev.multistack.app.entity.ItemEntity
import dev.multistack.app.entity.UserEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface UserRepository : JpaRepository<UserEntity, Long> {
    fun findByUsername(username: String): Optional<UserEntity>

    fun existsByUsername(username: String): Boolean
}

interface ItemRepository : JpaRepository<ItemEntity, Long>
