package com.financetracker.entity;

public enum PaymentType {
    ONE_TIME,    // 一括払い - Thanh toán 1 lần (default)
    INSTALLMENT, // 分割払い - Trả góp
    REVOLVING    // リボ払い - Thanh toán linh hoạt
}
