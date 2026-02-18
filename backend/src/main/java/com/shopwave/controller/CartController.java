package com.shopwave.controller;

import com.shopwave.exception.ResourceNotFoundException;
import com.shopwave.model.*;
import com.shopwave.repository.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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

    // ── GET CART ──────────────────────────────────────────────
    @GetMapping
    @Operation(summary = "Get current user's cart")
    public ResponseEntity<Cart> getCart(Authentication auth) {
        User user = getUser(auth.getName());
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseGet(() -> createCart(user));
        return ResponseEntity.ok(cart);
    }

    // ── ADD ITEM TO CART ──────────────────────────────────────
    @PostMapping("/items")
    @Operation(summary = "Add a product to cart")
    public ResponseEntity<Cart> addItem(
            @RequestBody Map<String, Object> body,
            Authentication auth) {

        User user = getUser(auth.getName());
        Long productId = Long.valueOf(body.get("productId").toString());
        int quantity = body.containsKey("quantity")
                ? Integer.parseInt(body.get("quantity").toString()) : 1;

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        if (product.getStock() < quantity)
            throw new RuntimeException("Insufficient stock for: " + product.getName());

        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseGet(() -> createCart(user));

        // Check if item already in cart
        CartItem existing = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst().orElse(null);

        if (existing != null) {
            int newQty = Math.min(existing.getQuantity() + quantity, product.getStock());
            existing.setQuantity(newQty);
            existing.setTotalPrice(product.getPrice().multiply(BigDecimal.valueOf(newQty)));
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(quantity)
                    .totalPrice(product.getPrice().multiply(BigDecimal.valueOf(quantity)))
                    .build();
            cart.getItems().add(item);
        }

        return ResponseEntity.ok(cartRepository.save(cart));
    }

    // ── UPDATE ITEM QUANTITY ──────────────────────────────────
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
                    item.setTotalPrice(item.getProduct().getPrice()
                            .multiply(BigDecimal.valueOf(quantity)));
                });
        }
        return ResponseEntity.ok(cartRepository.save(cart));
    }

    // ── REMOVE ITEM ───────────────────────────────────────────
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

    // ── CLEAR CART ────────────────────────────────────────────
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

    // ── HELPERS ───────────────────────────────────────────────
    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Cart createCart(User user) {
        Cart cart = Cart.builder().user(user).build();
        return cartRepository.save(cart);
    }
}