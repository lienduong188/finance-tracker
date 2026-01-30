package com.financetracker.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RestoreAccountRequest {

    @NotBlank(message = "Password is required")
    private String password;
}
