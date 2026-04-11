package com.interview.boat.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final String DEFAULT_MESSAGE = "Invalid value";
    private static final String VALIDATION_FAILED_MESSAGE = "Validation failed";

    public record ErrorResponse(String message, int status, String path, Instant timestamp, Map<String, String> fieldErrors) {
        ErrorResponse(String message, int status, String path) {
            this(message, status, path, Instant.now(), null);
        }

        ErrorResponse(String message, int status, String path, Map<String, String> fieldErrors) {
            this(message, status, path, Instant.now(), fieldErrors);
        }
    }

    @ExceptionHandler(BoatNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleBoatNotFound(BoatNotFoundException exception, HttpServletRequest request) {
        log.warn("Resource not found: {} {}", request.getMethod(), request.getRequestURI());
        return error(HttpStatus.NOT_FOUND, exception.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        Map<String, String> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> defaultMessage(error.getDefaultMessage()),
                        (existing, replacement) -> existing,
                        LinkedHashMap::new
                ));
        return validationError(fieldErrors, request);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponse> handleHandlerMethodValidation(HandlerMethodValidationException exception, HttpServletRequest request) {
        Map<String, String> fieldErrors = exception.getParameterValidationResults().stream()
                .flatMap(result -> result.getResolvableErrors().stream()
                        .map(error -> Map.entry(
                                result.getMethodParameter().getParameterName() != null
                                        ? result.getMethodParameter().getParameterName()
                                        : result.getMethodParameter().getExecutable().getName(),
                                defaultMessage(error.getDefaultMessage())
                        )))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (existing, replacement) -> existing,
                        LinkedHashMap::new
                ));

        return validationError(fieldErrors, request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException exception, HttpServletRequest request) {
        Map<String, String> fieldErrors = exception.getConstraintViolations().stream()
                .collect(Collectors.toMap(
                        violation -> normalizeFieldName(violation.getPropertyPath() != null ? violation.getPropertyPath().toString() : "request"),
                        violation -> defaultMessage(violation.getMessage()),
                        (existing, replacement) -> existing,
                        LinkedHashMap::new
                ));

        return validationError(fieldErrors, request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException exception, HttpServletRequest request) {
        String parameterName = exception.getName();
        String requiredType = exception.getRequiredType() != null ? exception.getRequiredType().getSimpleName() : "valid type";

        return error(HttpStatus.BAD_REQUEST, "Invalid parameter type", request, Map.of(parameterName, "Expected " + requiredType));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableMessage(HttpMessageNotReadableException exception, HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "Malformed JSON request", request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException exception, HttpServletRequest request) {
        return error(HttpStatus.CONFLICT, "Database constraint violation", request);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException exception, HttpServletRequest request) {
        return error(HttpStatus.UNAUTHORIZED, "Authentication required", request);
    }


    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
        log.error("Unexpected error on {} {}", request.getMethod(), request.getRequestURI(), exception);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request);
    }

    private ResponseEntity<ErrorResponse> validationError(Map<String, String> fieldErrors, HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, VALIDATION_FAILED_MESSAGE, request, fieldErrors);
    }

    private ResponseEntity<ErrorResponse> error(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity
                .status(status)
                .body(new ErrorResponse(message, status.value(), request.getRequestURI()));
    }

    private ResponseEntity<ErrorResponse> error(HttpStatus status, String message, HttpServletRequest request, Map<String, String> fieldErrors) {
        return ResponseEntity
                .status(status)
                .body(new ErrorResponse(message, status.value(), request.getRequestURI(), fieldErrors));
    }

    private String defaultMessage(String message) {
        return Objects.requireNonNullElse(message, DEFAULT_MESSAGE);
    }

    private String normalizeFieldName(String path) {
        int lastDot = path.lastIndexOf('.');
        return lastDot >= 0 ? path.substring(lastDot + 1) : path;
    }
}

