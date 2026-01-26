package com.financetracker.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private OffsetDateTime timestamp;
    private int status;
    private String code;        // Error code: AUTH_001, VAL_001, etc.
    private String message;     // Default English message
    private String messageKey;  // i18n key: "errors.auth.invalidCredentials"
    private Map<String, String> errors;      // Field validation errors
    private Map<String, String> errorKeys;   // Field error i18n keys
}
