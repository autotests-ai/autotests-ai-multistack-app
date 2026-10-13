package dev.multistack.app

import dev.multistack.app.config.AppConfig
import dev.multistack.app.db.Database
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty

fun main() {
    val config = AppConfig.fromEnv()
    val dataSource = Database.createDataSource(config)
    Database.migrate(dataSource)

    val deps = AppDependencies(dataSource, config)
    deps.userSeeder.seed()

    // Management endpoints live on a separate port so the API surface stays free of /actuator
    // (same split as Spring Boot's management.server.port). Compose publishes this to host
    // loopback only; nginx does not proxy it.
    embeddedServer(Netty, port = config.managementPort, module = { managementModule(deps) })
        .start(wait = false)
    embeddedServer(Netty, port = config.serverPort, module = { appModule(deps) })
        .start(wait = true)
}
