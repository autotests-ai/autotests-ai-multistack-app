package dev.multistack.app

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class MultistackApplication

fun main(args: Array<String>) {
    runApplication<MultistackApplication>(*args)
}
