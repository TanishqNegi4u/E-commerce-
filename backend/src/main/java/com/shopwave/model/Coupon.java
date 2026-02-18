package com.shopwave.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "coupons")
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;

    @Enumerated(EnumType.STRING)
    private DiscountType discountType;

    private BigDecimal discountValue;

    private BigDecimal minOrderAmount;

    private BigDecimal maxDiscountAmount;

    private Boolean active;

    private Integer usedCount = 0;

    public enum DiscountType {
        PERCENTAGE, FLAT
    }

    public boolean isValid() {
        return Boolean.TRUE.equals(this.active);
    }
}