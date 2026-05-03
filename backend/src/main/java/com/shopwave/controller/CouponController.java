package com.shopwave.controller;

import com.shopwave.model.Coupon;
import com.shopwave.repository.CouponRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/coupons")
@RequiredArgsConstructor
@Tag(name = "Coupons", description = "Coupon validation APIs")
public class CouponController {

    private final CouponRepository couponRepository;

    /**
     * Validate coupon against order subtotal.
     * Returns discount info so frontend can display the real discounted total.
     * Actual usedCount increment only happens in OrderService (atomic @Query).
     */
    @GetMapping("/validate")
    @Operation(summary = "Validate a coupon code and return discount details")
    public ResponseEntity<?> validate(
            @RequestParam String code,
            @RequestParam(defaultValue = "0") BigDecimal subtotal) {

        return couponRepository.findByCodeAndActiveTrue(code.toUpperCase())
            .filter(Coupon::isValid)
            .filter(c -> c.getMinOrderAmount() == null ||
                subtotal.compareTo(c.getMinOrderAmount()) >= 0)
            .map(c -> {
                BigDecimal discount;
                if (c.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
                    discount = subtotal.multiply(c.getDiscountValue().divide(new BigDecimal("100")));
                    if (c.getMaxDiscountAmount() != null &&
                        discount.compareTo(c.getMaxDiscountAmount()) > 0) {
                        discount = c.getMaxDiscountAmount();
                    }
                } else {
                    discount = c.getDiscountValue();
                }
                return ResponseEntity.ok(Map.of(
                    "valid",           true,
                    "code",            c.getCode(),
                    "discountType",    c.getDiscountType().name(),
                    "discountValue",   c.getDiscountValue(),
                    "discountAmount",  discount,
                    "minOrderAmount",  c.getMinOrderAmount() != null ? c.getMinOrderAmount() : 0
                ));
            })
            .orElseGet(() -> ResponseEntity.ok(Map.of(
                "valid", false,
                "message", subtotal.compareTo(BigDecimal.ZERO) > 0
                    ? "Coupon not found or minimum order amount not met"
                    : "Coupon not found or inactive"
            )));
    }
}