package com.shopwave.controller;

import com.shopwave.dto.PaymentIntentRequest;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * Stripe test-mode payment intent flow.
 *
 * FAANG talking points:
 *  • Idempotency  — Stripe PaymentIntents never double-charge with same idempotency key.
 *  • PCI scope    — raw card numbers never touch our server; Stripe.js tokenises client-side.
 *  • Webhook      — production must verify payment_intent.succeeded via Stripe-Signature header,
 *                   never trust client-side confirmation alone.
 *
 * Test cards:
 *  ✅ 4242 4242 4242 4242   — success
 *  ❌ 4000 0000 0000 9995   — decline
 *  🔐 4000 0027 6000 3184   — 3D Secure
 */
@RestController
@RequestMapping("/payments")
@Slf4j
@Tag(name = "Payments", description = "Stripe test-mode endpoints")
public class PaymentController {

    @PostMapping("/create-intent")
    @Operation(summary = "Create PaymentIntent → returns clientSecret for Stripe.js")
    public ResponseEntity<?> createIntent(
            @Valid @RequestBody PaymentIntentRequest req,
            Authentication auth) {
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(req.getAmount())
                    .setCurrency(req.getCurrency().toLowerCase())
                    .setAutomaticPaymentMethodsBuilder(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder().setEnabled(true).build())
                    .putMetadata("orderNumber", req.getOrderNumber() != null ? req.getOrderNumber() : "")
                    .putMetadata("customer",    auth != null ? auth.getName() : "guest")
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);
            log.info("PaymentIntent {} created for order {}", intent.getId(), req.getOrderNumber());

            return ResponseEntity.ok(Map.of(
                "clientSecret",   intent.getClientSecret(),
                "paymentIntentId", intent.getId()
            ));
        } catch (StripeException e) {
            log.error("Stripe error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/confirm/{paymentIntentId}")
    @Operation(summary = "Retrieve PaymentIntent status (server-side fallback)")
    public ResponseEntity<?> confirmPayment(@PathVariable String paymentIntentId) {
        try {
            PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
            return ResponseEntity.ok(Map.of("status", intent.getStatus(), "id", intent.getId()));
        } catch (StripeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}