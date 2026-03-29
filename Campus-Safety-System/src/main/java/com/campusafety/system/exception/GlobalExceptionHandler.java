package com.campusafety.system.exception;

import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(
            ResourceNotFoundException ex,
            HttpServletRequest request) {

        logger.warn("Resource not found: {} | Path: {}",
                ex.getMessage(),
                request.getRequestURI());

        return buildError(
                HttpStatus.NOT_FOUND,
                "NOT_FOUND",
                ex.getMessage(),
                request
        );
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusiness(
            BusinessException ex,
            HttpServletRequest request) {

        logger.warn("Business rule violation: {} | Path: {}",
                ex.getMessage(),
                request.getRequestURI());

        return buildError(
                HttpStatus.BAD_REQUEST,
                "BUSINESS_RULE_VIOLATION",
                ex.getMessage(),
                request
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .reduce((a, b) -> a + ", " + b)
                .orElse("Validation error");

        logger.warn("Validation error: {} | Path: {}",
                message,
                request.getRequestURI());

        return buildError(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                message,
                request
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request) {

        logger.warn("Access denied: {} | Path: {}",
                ex.getMessage(),
                request.getRequestURI());

        return buildError(
                HttpStatus.FORBIDDEN,
                "FORBIDDEN",
                "You do not have permission to access this resource",
                request
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleInvalidFormat(
            HttpMessageNotReadableException ex,
            HttpServletRequest request) {

        logger.warn("Invalid request body format | Path: {}",
                request.getRequestURI());

        return buildError(
                HttpStatus.BAD_REQUEST,
                "INVALID_REQUEST_BODY",
                "Invalid request format",
                request
        );
    }
    

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(
            Exception ex,
            HttpServletRequest request) {

        logger.error("Unexpected error at {}",
                request.getRequestURI(),
                ex);

        return buildError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred",
                request
        );
    }

    private ResponseEntity<ApiError> buildError(
            HttpStatus status,
            String error,
            String message,
            HttpServletRequest request) {

        ApiError apiError = new ApiError(
                status.value(),
                error,
                message,
                request.getRequestURI()
        );

        return new ResponseEntity<>(apiError, status);
    }
    @ExceptionHandler(AuthenticationFailedException.class)
    public ResponseEntity<ApiError> handleAuthenticationFailed(
            AuthenticationFailedException ex,
            HttpServletRequest request) {

        logger.warn("Authentication failed: {} | Path: {}",
                ex.getMessage(),
                request.getRequestURI());

        return buildError(
                HttpStatus.UNAUTHORIZED,
                "UNAUTHORIZED",
                ex.getMessage(),
                request
        );
    }
}