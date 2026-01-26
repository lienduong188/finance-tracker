package com.financetracker.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // Auth errors (AUTH_xxx)
    AUTH_001("AUTH_001", "Invalid credentials", "errors.auth.invalidCredentials", HttpStatus.UNAUTHORIZED),
    AUTH_002("AUTH_002", "Email already registered", "errors.auth.emailExists", HttpStatus.CONFLICT),
    AUTH_003("AUTH_003", "Invalid refresh token", "errors.auth.invalidToken", HttpStatus.UNAUTHORIZED),
    AUTH_004("AUTH_004", "Token expired", "errors.auth.tokenExpired", HttpStatus.UNAUTHORIZED),
    AUTH_005("AUTH_005", "Account disabled", "errors.auth.accountDisabled", HttpStatus.FORBIDDEN),

    // Validation errors (VAL_xxx)
    VAL_001("VAL_001", "Validation failed", "errors.validation.failed", HttpStatus.BAD_REQUEST),
    VAL_002("VAL_002", "Invalid email format", "errors.validation.emailInvalid", HttpStatus.BAD_REQUEST),
    VAL_003("VAL_003", "Password too weak", "errors.validation.passwordWeak", HttpStatus.BAD_REQUEST),

    // Resource errors (RES_xxx)
    RES_001("RES_001", "Resource not found", "errors.resource.notFound", HttpStatus.NOT_FOUND),
    RES_002("RES_002", "Resource already exists", "errors.resource.exists", HttpStatus.CONFLICT),
    RES_003("RES_003", "Access denied", "errors.resource.accessDenied", HttpStatus.FORBIDDEN),

    // Transaction errors (TXN_xxx)
    TXN_001("TXN_001", "Insufficient balance", "errors.transaction.insufficientBalance", HttpStatus.BAD_REQUEST),
    TXN_002("TXN_002", "Invalid transfer", "errors.transaction.invalidTransfer", HttpStatus.BAD_REQUEST),
    TXN_003("TXN_003", "Same account transfer", "errors.transaction.sameAccount", HttpStatus.BAD_REQUEST),

    // Budget errors (BUD_xxx)
    BUD_001("BUD_001", "Budget period overlap", "errors.budget.periodOverlap", HttpStatus.CONFLICT),

    // System errors (SYS_xxx)
    SYS_001("SYS_001", "Internal server error", "errors.system.internal", HttpStatus.INTERNAL_SERVER_ERROR),
    SYS_002("SYS_002", "Service unavailable", "errors.system.unavailable", HttpStatus.SERVICE_UNAVAILABLE);

    private final String code;
    private final String message;
    private final String messageKey;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String message, String messageKey, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.messageKey = messageKey;
        this.httpStatus = httpStatus;
    }
}
