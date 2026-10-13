package dev.multistack.app.allure

import io.qameta.allure.LabelAnnotation
import java.lang.annotation.Inherited

@MustBeDocumented
@Inherited
@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.FUNCTION, AnnotationTarget.CLASS)
@LabelAnnotation(name = "language")
annotation class Language(val value: String)
