package com.shopwave.controller;

import com.shopwave.dto.AddToCartRequest;
import com.shopwave.exception.ResourceNotFoundException;
import com.shopwave.model.*;
import com.shopwave.repository.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Shopping cart APIs")
public class CartController {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @GetMapping
    @Operation(summary = "Get current user's cart")
    public ResponseEntity<Cart> getCart(Authentication auth) {
        User user = getUser(auth.getName());
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseGet(() -> createCart(user));
        return ResponseEntity.ok(cart);
    }

    @Transactional
    @PostMapping("/items")
    @Operation(summary = "Add a product to cart")
    public ResponseEntity<Cart> addItem(
            @Valid @RequestBody AddToCartRequest request,
            Authentication auth) {

        User user = getUser(auth.getName());
        Long productId = request.getProductId();
        int quantity = request.getQuantity();

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        if (product.getStock() < quantity)
            throw new RuntimeException("Insufficient stock for: " + product.getName());

        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseGet(() -> createCart(user));

        CartItem existing = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst().orElse(null);

        if (existing != null) {
            int newQty = Math.min(existing.getQuantity() + quantity, product.getStock());
            existing.setQuantity(newQty);
            existing.setUnitPrice(product.getPrice());  // keep unitPrice in sync
            existing.setTotalPrice(product.getPrice().multiply(BigDecimal.valueOf(newQty)));
        } else {
            // BUG-2 FIX: unitPrice was missing — caused DataIntegrityViolationException
            // because CartItem.unitPrice is @Column(nullable = false)
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(quantity)
                    .unitPrice(product.getPrice())          // ← REQUIRED: was missing
                    .totalPrice(product.getPrice().multiply(BigDecimal.valueOf(quantity)))
                    .build();
            cart.getItems().add(item);
        }

        return ResponseEntity.ok(cartRepository.save(cart));
    }

    @Transactional
    @PutMapping("/items/{productId}")
    @Operation(summary = "Update cart item quantity")
    public ResponseEntity<Cart> updateItem(
            @PathVariable Long productId,
            @RequestBody Map<String, Integer> body,
            Authentication auth) {

        User user = getUser(auth.getName());
        int quantity = body.getOrDefault("quantity", 1);

        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        if (quantity <= 0) {
            cart.getItems().removeIf(i -> i.getProduct().getId().equals(productId));
        } else {
            cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst()
                .ifPresent(item -> {
                    item.setQuantity(quantity);
                    item.setTotalPrice(item.getUnitPrice()
                            .multiply(BigDecimal.valueOf(quantity)));
                });
        }
        return ResponseEntity.ok(cartRepository.save(cart));
    }

    @Transactional
    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove item from cart")
    public ResponseEntity<Cart> removeItem(
            @PathVariable Long productId,
            Authentication auth) {

        User user = getUser(auth.getName());
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        cart.getItems().removeIf(i -> i.getProduct().getId().equals(productId));
        return ResponseEntity.ok(cartRepository.save(cart));
    }

    @Transactional
    @DeleteMapping
    @Operation(summary = "Clear all items from cart")
    public ResponseEntity<Void> clearCart(Authentication auth) {
        User user = getUser(auth.getName());
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));
        cart.getItems().clear();
        cartRepository.save(cart);
        return ResponseEntity.noContent().build();
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Cart createCart(User user) {
        Cart cart = Cart.builder().user(user).build();
        return cartRepository.save(cart);
    }
}