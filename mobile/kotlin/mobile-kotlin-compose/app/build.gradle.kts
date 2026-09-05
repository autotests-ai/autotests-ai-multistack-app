plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

fun stringProp(name: String, fallback: String): String =
    (project.findProperty(name) as String?)?.takeIf { it.isNotBlank() } ?: fallback

/**
 * `-Penv=ci|stage|prod` is the API stand (web `-Denv` / `apiBaseUrl`), not
 * deviceHost. CLI `-PapiBase=` still wins. Default is gradle.properties (prod).
 */
val envApiBases = mapOf(
    "ci" to "http://10.0.2.2:8800/api",
    "stage" to "https://stage.autotests.ai/stack/backend-java-spring/api",
    "prod" to "https://autotests.ai/stack/backend-java-spring/api",
)

fun cliProp(name: String): String? =
    gradle.startParameter.projectProperties[name]?.takeIf { it.isNotBlank() }

fun resolvedApiBase(): String {
    cliProp("apiBase")?.let { return it }
    val envName = cliProp("env")
    if (envName != null) {
        return envApiBases[envName]
            ?: error(
                "Unknown -Penv=$envName. Use ci, stage or prod — or pass -PapiBase=. " +
                    "No mock stand. -Penv is apiBase, not deviceHost.",
            )
    }
    return stringProp("apiBase", "https://autotests.ai/stack/backend-java-spring/api")
}

android {
    namespace = "dev.multistack.compose"
    compileSdk = 34

    defaultConfig {
        applicationId = "dev.multistack.compose"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"

        buildConfigField(
            "String",
            "API_BASE",
            "\"${resolvedApiBase()}\"",
        )
        buildConfigField(
            "String",
            "BACKEND_ID",
            "\"${stringProp("backendId", "backend-java-spring")}\"",
        )
        buildConfigField(
            "String",
            "STACK_INDEX_URL",
            "\"${stringProp("stackIndexUrl", "https://autotests.ai/stack/")}\"",
        )
    }

    buildTypes {
        // Debug is the Appium artifact: same ids, no shrinking, cleartext allowed
        // so the emulator can reach a local backend on 10.0.2.2.
        getByName("debug") {
            isMinifyEnabled = false
        }
        getByName("release") {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
}

android.applicationVariants.configureEach {
    outputs.configureEach {
        (this as com.android.build.gradle.internal.api.BaseVariantOutputImpl)
            .outputFileName = "multistack-app.apk"
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.foundation)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.tooling.preview)
    debugImplementation(libs.androidx.compose.ui.tooling)
}
