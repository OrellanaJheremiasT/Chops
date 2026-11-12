package com.stockflow.shared;

import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Renders API errors (ResponseStatusException, validation failures, ...) as
 * RFC 9457 ProblemDetail JSON so the frontend can read the "detail" message.
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {
}
