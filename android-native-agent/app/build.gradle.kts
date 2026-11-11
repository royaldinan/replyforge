plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "id.replyforge.agent"
    compileSdk {
        version = release(37)
    }

    defaultConfig {
        applicationId = "id.replyforge.agent"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(libs.appcompat)
    implementation(libs.material)
}

