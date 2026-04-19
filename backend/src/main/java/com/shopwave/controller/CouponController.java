package com.shopwave.controller;

import com.shopwave.model.Coupon;
import com.shopwave.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponRepository couponRepository;

    @GetMapping("/validate")
    public ResponseEntity<?> validate(@RequestParam String code) {
        return couponRepository.findByCodeAndActiveTrue(code.toUpperCase())
            .filter(Coupon::isValid)
            .map(c -> {
                double discountPercent = 0;
                if (c.getDiscountType() == Coupon.DiscountType.PERCENTAGE && c.getDiscountValue() != null) {
                    discountPercent = c.getDiscountValue().doubleValue();
                }
                return ResponseEntity.ok(Map.of(
                    "code",            c.getCode(),
                    "discountPercent", discountPercent,
                    "discountType",    c.getDiscountType().name(),
                    "discountValue",   c.getDiscountValue() != null ? c.getDiscountValue() : 0
                ));
            })
            .orElse(ResponseEntity.notFound().build());
    }
}