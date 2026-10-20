package com.bookarchive.auth

import com.bookarchive.web.ApiException
import org.springframework.core.MethodParameter
import org.springframework.http.HttpStatus
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Component
import org.springframework.web.bind.support.WebDataBinderFactory
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.method.support.ModelAndViewContainer

// 컨트롤러 메서드에 AuthUser 파라미터를 선언하면 현재 로그인 사용자가 주입된다.
@Component
class CurrentUserArgumentResolver(private val userService: UserService) : HandlerMethodArgumentResolver {
    override fun supportsParameter(parameter: MethodParameter) =
        parameter.parameterType == AuthUser::class.java

    override fun resolveArgument(
        parameter: MethodParameter,
        mavContainer: ModelAndViewContainer?,
        webRequest: NativeWebRequest,
        binderFactory: WebDataBinderFactory?,
    ): AuthUser {
        val jwt = SecurityContextHolder.getContext().authentication?.principal as? Jwt
            ?: throw ApiException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.")
        val user = userService.resolve(jwt)
        return AuthUser(user.id, user.email)
    }
}
