package com.bookarchive.auth

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

data class Credentials(val email: String, val password: String)

data class UserOut(val id: UUID, val email: String)

// Supabase 의 세션 응답과 같은 필드명(access_token, token_type, expires_in, user)을 쓴다.
data class AuthResponse(
    val accessToken: String,
    val tokenType: String = "bearer",
    val expiresIn: Long,
    val user: UserOut,
)

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val userService: UserService,
    private val tokenService: TokenService,
) {
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    fun signup(@RequestBody body: Credentials): AuthResponse =
        respond(userService.signup(body.email, body.password))

    @PostMapping("/login")
    fun login(@RequestBody body: Credentials): AuthResponse =
        respond(userService.login(body.email, body.password))

    @GetMapping("/me")
    fun me(user: AuthUser) = UserOut(user.id, user.email)

    private fun respond(user: User): AuthResponse {
        val token = tokenService.issue(user)
        return AuthResponse(
            accessToken = token.value,
            expiresIn = token.expiresIn,
            user = UserOut(user.id, user.email),
        )
    }
}
