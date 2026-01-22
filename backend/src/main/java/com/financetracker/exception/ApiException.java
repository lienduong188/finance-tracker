package com.financetracker.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public ApiException(String message, HttpStatus status, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public ApiException(String message, HttpStatus status) {
        this(message, status, status.name());
    }

    public static ApiException notFound(String resource) {
        return new ApiException(resource + " not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
    }

    public static ApiException badRequest(String message) {
        return new ApiException(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST");
    }

    public static ApiException conflict(String message) {
        return new ApiException(message, HttpStatus.CONFLICT, "CONFLICT");
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(message, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
    }
}
