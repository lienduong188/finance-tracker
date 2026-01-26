package com.financetracker.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    private static final int MIN_LENGTH = 8;
    private static final String UPPERCASE_PATTERN = ".*[A-Z].*";
    private static final String LOWERCASE_PATTERN = ".*[a-z].*";
    private static final String DIGIT_PATTERN = ".*\\d.*";

    @Override
    public void initialize(StrongPassword constraintAnnotation) {
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isBlank()) {
            return true; // Let @NotBlank handle null/blank validation
        }

        boolean valid = password.length() >= MIN_LENGTH
                && password.matches(UPPERCASE_PATTERN)
                && password.matches(LOWERCASE_PATTERN)
                && password.matches(DIGIT_PATTERN);

        return valid;
    }
}
