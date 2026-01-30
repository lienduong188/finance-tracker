package com.financetracker.entity;

public enum NotificationType {
    // Invitations
    INVITATION_RECEIVED,
    INVITATION_ACCEPTED,

    // Recurring transactions
    RECURRING_DUE_SOON,        // 3 days before due

    // Debts
    DEBT_DUE_SOON,             // 3 days before due

    // Credit card payments
    CREDIT_CARD_PAYMENT_DUE,   // Payment due soon
    CREDIT_CARD_PAYMENT_OVERDUE, // Payment overdue

    // Budgets
    BUDGET_WARNING,            // 80% reached
    BUDGET_EXCEEDED,           // 100% exceeded

    // Accounts
    ACCOUNT_LOW_BALANCE,       // Balance near zero
    ACCOUNT_EMPTY,             // Balance is 0 or negative

    // Exchange rates
    EXCHANGE_RATE_ALERT,       // JPY/VND reaches target

    // Savings goals
    SAVINGS_CONTRIBUTION,      // Someone contributed to group goal
    SAVINGS_GOAL_REACHED,      // Goal reached

    // Family/Group
    MEMBER_JOINED,             // New member joined
    MEMBER_LEFT,               // Member left

    // User account
    USER_ACCOUNT_DELETED       // User requested account deletion (notify admins)
}
