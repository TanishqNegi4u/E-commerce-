package com.shopwave.controller;

import com.shopwave.dto.ProductRequest;
import com.shopwave.model.Product;
import com.shopwave.model.User;
import com.shopwave.repository.UserRepository;
import com.shopwave.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product catalog APIs")
public class ProductController {

    private final ProductService productService;
    private final UserRepository userRepository;

    // ── GET ALL PRODUCTS (public) ─────────────────────────────
    private static final Set<String> ALLOWED_SORT_FIELDS =
            Set.of("createdAt", "price", "name", "averageRating", "totalSold");

    @GetMapping
    @Operation(summary = "Get all active products with pagination")
    public ResponseEntity<Page<Product>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        // C2 FIX: whitelist allowed sort fields to prevent field injection
        if (!ALLOWED_SORT_FIELDS.contains(sortBy)) {
            sortBy = "createdAt";
        }
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(productService.searchProducts("", pageable));
    }

    // ── GET PRODUCT BY ID (public) ────────────────────────────
    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    public ResponseEntity<Product> getById(@PathVariable Long id, Authentication auth) {
        Product product = productService.getProductById(id);
        // Track recently viewed per-user when logged in
        if (auth != null) {
            userRepository.findByEmail(auth.getName()).ifPresent(user ->
                productService.trackRecentlyViewed(user.getId(), id, product));
        }
        return ResponseEntity.ok(product);
    }

    // ── GET PRODUCT BY SLUG (public) ─────────────────────────
    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get product by slug")
    public ResponseEntity<Product> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(productService.getProductBySlug(slug));
    }

    // ── SEARCH (public) ───────────────────────────────────────
    @GetMapping("/search")
    @Operation(summary = "Search products by keyword")
    public ResponseEntity<Page<Product>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(productService.searchProducts(q, pageable));
    }

    // ── SEARCH SUGGESTIONS / AUTOCOMPLETE (public) ───────────
    @GetMapping("/search/suggestions")
    @Operation(summary = "Trie-powered autocomplete suggestions")
    public ResponseEntity<List<String>> suggestions(@RequestParam String prefix) {
        return ResponseEntity.ok(productService.getSearchSuggestions(prefix));
    }

    // ── FEATURED PRODUCTS (public) ───────────────────────────
    @GetMapping("/featured")
    @Operation(summary = "Get featured products")
    public ResponseEntity<List<Product>> getFeatured() {
        return ResponseEntity.ok(productService.getFeaturedProducts());
    }

    // ── BESTSELLERS (public) ──────────────────────────────────
    @GetMapping("/bestsellers")
    @Operation(summary = "Get bestselling products")
    public ResponseEntity<List<Product>> getBestsellers() {
        return ResponseEntity.ok(productService.getBestsellerProducts());
    }

    // ── RECENTLY VIEWED (auth required) ──────────────────────
    @GetMapping("/recently-viewed")
    @Operation(summary = "Get recently viewed products (LRU Cache — per user)")
    public ResponseEntity<List<Product>> getRecentlyViewed(Authentication auth) {
        if (auth == null) return ResponseEntity.ok(java.util.Collections.emptyList());
        return userRepository.findByEmail(auth.getName())
            .map(user -> ResponseEntity.ok(productService.getRecentlyViewed(user.getId())))
            .orElse(ResponseEntity.ok(java.util.Collections.emptyList()));
    }

    // ── BY CATEGORY (public) ─────────────────────────────────
    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Get products by category")
    public ResponseEntity<Page<Product>> getByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(productService.getProductsByCategory(categoryId, pageable));
    }

    // ── CREATE PRODUCT (Admin/Seller) ─────────────────────────
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SELLER')")
    @Operation(summary = "Create a new product")
    public ResponseEntity<Product> create(
            @Valid @RequestBody ProductRequest request,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.createProduct(request, auth.getName()));
    }

    // ── UPDATE PRODUCT (Admin/Seller) ─────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SELLER')")
    @Operation(summary = "Update an existing product")
    public ResponseEntity<Product> update(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request,
            Authentication auth) {
        return ResponseEntity.ok(productService.updateProduct(id, request, auth.getName()));
    }

    // ── DELETE PRODUCT (Admin only) ───────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Discontinue a product")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}