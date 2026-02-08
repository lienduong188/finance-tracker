package com.financetracker.dto.user;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain letters, numbers, dots, underscores and hyphens")
    private String username;

    @Size(min = 2, message = "Name must be at least 2 characters")
    private String fullName;

    @Size(min = 3, max = 3, message = "Currency must be 3 characters")
    private String defaultCurrency;
}
