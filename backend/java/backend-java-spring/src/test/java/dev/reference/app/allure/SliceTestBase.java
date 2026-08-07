package dev.reference.app.allure;

import io.qameta.allure.Owner;

/**
 * Shared Allure labels for Spring slice tests (`@WebMvcTest`, `@DataJpaTest`).
 * Same pyramid layer and CI job as plain unit tests ({@code layer=unit} keeps the
 * six-layer teaching pyramid intact), but the {@code suite=slice} label separates
 * partial-Spring-context tests from one-class-in-isolation units in the report.
 */
@Owner("stanislav")
@Layer("unit")
@Suite("slice")
@Module("backend-java-spring")
@Language("java")
public abstract class SliceTestBase {
}
