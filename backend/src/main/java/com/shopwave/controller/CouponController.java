package com.shopwave.controller;

import com.shopwave.model.Coupon;
import com.shopwave.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponRepository couponRepository;

    @GetMapping("/validate")
    public ResponseEntity<?> validate(@RequestParam String code) {
        return couponRepository.findByCode(code.toUpperCase())
            .filter(Coupon::isActive)
            .filter(c -> c.getExpiryDate() == null || c.getExpiryDate().isAfter(LocalDateTime.now()))
            .map(c -> ResponseEntity.ok(Map.of(
                "code", c.getCode(),
                "discountPercent", c.getDiscountPercent()
            )))
            .orElse(ResponseEntity.notFound().build());
    }
}