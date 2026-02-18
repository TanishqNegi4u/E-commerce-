
package com.shopwave.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(columnDefinition = "TEXT")
    private String highlights; // ADDED THIS

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "compare_price", precision = 10, scale = 2)
    private BigDecimal comparePrice;

    @Column(name = "cost_price", precision = 10, scale = 2)
    private BigDecimal costPrice;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    private String brand;

    private String sku;

    @Column(name = "stock_quantity")
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "low_stock_threshold")
    @Builder.Default
    private Integer lowStockThreshold = 5;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    private Double rating;

    @Column(name = "review_count")
    @Builder.Default
    private Integer reviewCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Transient
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @Transient
    @Builder.Default
    private Map<String, String> specifications = new HashMap<>();

    @Transient
    private BigDecimal originalPrice;

    @Transient
    private Integer discountPercent;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Alias methods
    public Integer getStock() {
        return stockQuantity;
    }

    public void setStock(Integer stock) {
        this.stockQuantity = stock;
    }

    public Double getAverageRating() {
        return rating;
    }

    public void setAverageRating(Double averageRating) {
        this.rating = averageRating;
    }
    
    // Product status enum (nested class)
    public static enum ProductStatus {
        ACTIVE, INACTIVE, OUT_OF_STOCK, DISCONTINUED
    }
    
    // Get status based on stock and isActive
    public ProductStatus getProductStatus() {
        if (!isActive) return ProductStatus.INACTIVE;
        if (stockQuantity == null || stockQuantity <= 0) return ProductStatus.OUT_OF_STOCK;
        return ProductStatus.ACTIVE;
    }
}