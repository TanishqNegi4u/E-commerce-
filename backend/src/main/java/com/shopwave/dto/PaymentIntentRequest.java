package com.shopwave.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentIntentRequest {
    @Min(value = 50, message = "Amount must be at least 50 smallest-currency units")
    private long amount;       // paise for INR

    @NotBlank(message = "Currency required (e.g. inr)")
    private String currency;

    private String orderNumber; // metadata
}