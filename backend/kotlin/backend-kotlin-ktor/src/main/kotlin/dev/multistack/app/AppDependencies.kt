package dev.multistack.app

import dev.multistack.app.config.AppConfig
import dev.multistack.app.config.UserSeeder
import dev.multistack.app.config.installCors
import dev.multistack.app.config.installJwtAuth
import dev.multistack.app.config.installStatusPages
import dev.multistack.app.db.ItemRepository
import dev.multistack.app.db.UserRepository
import dev.multistack.app.routes.apiRoutes
import dev.multistack.app.routes.authRoutes
import dev.multistack.app.routes.managementRoutes
import dev.multistack.app.service.AuthService
import dev.multistack.app.service.ItemService
import dev.multistack.app.service.JwtService
import dev.multistack.app.service.PasswordHasher
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.metrics.micrometer.MicrometerMetrics
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.routing.routing
import io.micrometer.core.instrument.binder.jvm.JvmGcMetrics
import io.micrometer.core.instrument.binder.jvm.JvmMemoryMetrics
import io.micrometer.core.instrument.binder.jvm.JvmThreadMetrics
import io.micrometer.core.instrument.binder.system.ProcessorMetrics
import io.micrometer.prometheusmetrics.PrometheusConfig
import io.micrometer.prometheusmetrics.PrometheusMeterRegistry
import kotlinx.serialization.json.Json
import javax.sql.DataSource

/** Hand-wired dependency graph — Ktor has no DI container, the wiring is explicit here. */
class AppDependencies(
    val dataSource: DataSource,
    config: AppConfig,
) {
    val prometheusRegistry = PrometheusMeterRegistry(PrometheusConfig.DEFAULT).also { registry ->
        // Actuator parity: Spring Boot auto-binds these; Ktor's plugin only wires HTTP timers.
        JvmMemoryMetrics().bindTo(registry)
        JvmGcMetrics().bindTo(registry)
        JvmThreadMetrics().bindTo(registry)
        ProcessorMetrics().bindTo(registry)
    }

    val itemRepository = ItemRepository(dataSource)
    val userRepository = UserRepository(dataSource)
    val passwordHasher = PasswordHasher()
    val jwtService = JwtService(config.jwtSecret, config.jwtExpirationMs)
    val authService = AuthService(userRepository, passwordHasher, jwtService)
    val itemService = ItemService(itemRepository)
    val userSeeder = UserSeeder(userRepository, passwordHasher)
}

fun Application.appModule(deps: AppDependencies) {
    install(ContentNegotiation) {
        // ignoreUnknownKeys mirrors Spring Boot's default FAIL_ON_UNKNOWN_PROPERTIES=false.
        json(Json { ignoreUnknownKeys = true })
    }
    install(MicrometerMetrics) {
        registry = deps.prometheusRegistry
    }
    installCors()
    installStatusPages()
    installJwtAuth(deps.jwtService)
    routing {
        apiRoutes(deps.itemService)
        authRoutes(deps.authService)
    }
}

fun Application.managementModule(deps: AppDependencies) {
    routing {
        managementRoutes(deps.prometheusRegistry)
    }
}
