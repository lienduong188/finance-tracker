package com.financetracker.entity;

public enum FamilyRole {
    OWNER,   // Full control, can delete family
    ADMIN,   // Can manage members and shared accounts
    MEMBER   // Can view and contribute to shared resources
}
