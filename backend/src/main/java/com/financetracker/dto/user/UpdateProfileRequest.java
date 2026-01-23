package com.financetracker.dto.user;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 2, message = "Name must be at least 2 characters")
    private String fullName;

    @Size(min = 3, max = 3, message = "Currency must be 3 characters")
    private String defaultCurrency;
}
