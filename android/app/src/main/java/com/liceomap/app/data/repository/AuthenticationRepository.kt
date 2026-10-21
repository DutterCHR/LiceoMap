package com.liceomap.app.data.repository

import com.liceomap.app.model.AuthenticationResult

/** Future authentication boundary. DemoEntry deliberately does not implement it. */
interface AuthenticationRepository {
    suspend fun authenticate(rut: String, password: String): AuthenticationResult
}
