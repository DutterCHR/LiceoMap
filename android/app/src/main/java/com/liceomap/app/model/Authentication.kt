package com.liceomap.app.model

data class AuthenticatedUser(val id: String, val course: String)

sealed interface AuthenticationResult {
    data class Authenticated(val user: AuthenticatedUser) : AuthenticationResult
    data class Rejected(val message: String) : AuthenticationResult
}
