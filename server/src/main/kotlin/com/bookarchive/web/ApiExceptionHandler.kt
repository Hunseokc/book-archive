package com.bookarchive.web

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException

class ApiException(val status: HttpStatus, val detail: String) : RuntimeException(detail)

data class ErrorResponse(val detail: String)

// 프런트엔드가 body.detail 을 에러 메시지로 쓰므로 FastAPI 와 같은 {"detail": "..."} 형식을 유지한다.
@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(ApiException::class)
    fun handleApi(e: ApiException) = ResponseEntity.status(e.status).body(ErrorResponse(e.detail))

    @ExceptionHandler(
        HttpMessageNotReadableException::class,
        MissingServletRequestParameterException::class,
        MethodArgumentTypeMismatchException::class,
        IllegalArgumentException::class,
    )
    fun handleInvalid(e: Exception) =
        ResponseEntity.unprocessableEntity().body(ErrorResponse("요청 형식이 올바르지 않습니다."))
}
