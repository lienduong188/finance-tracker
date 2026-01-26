package com.financetracker.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final String messageKey;

    public ApiException(String message, HttpStatus status, String code, String messageKey) {
        super(message);
        this.status = status;
        this.code = code;
        this.messageKey = messageKey;
    }

    public ApiException(String message, HttpStatus status, String code) {
        this(message, status, code, null);
    }

    public ApiException(String message, HttpStatus status) {
        this(message, status, status.name(), null);
    }

    public ApiException(ErrorCode errorCode) {
        this(errorCode.getMessage(), errorCode.getHttpStatus(), errorCode.getCode(), errorCode.getMessageKey());
    }

    public ApiException(ErrorCode errorCode, String customMessage) {
        this(customMessage, errorCode.getHttpStatus(), errorCode.getCode(), errorCode.getMessageKey());
    }

    public static ApiException notFound(String resource) {
        return new ApiException(resource + " not found", HttpStatus.NOT_FOUND,
                ErrorCode.RES_001.getCode(), ErrorCode.RES_001.getMessageKey());
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
