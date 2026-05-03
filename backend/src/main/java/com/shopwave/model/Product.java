package com.shopwave.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "products")
@Getter
@Setter
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
    private String highlights;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "discount_percent")
    private Integer discountPercent;

    @Column(name = "compare_price", precision = 10, scale = 2)
    private BigDecimal comparePrice;

    @Column(name = "cost_price", precision = 10, scale = 2)
    private BigDecimal costPrice;

    // FIX (MED-02): Changed from FetchType.EAGER to FetchType.LAZY to avoid N+1
    // queries on product list endpoints and unnecessary joins on every product load.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private User seller;

    private String brand;

    private String sku;

    @Column(name = "stock")
    @Builder.Default
    private Integer stock = 0;

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

    @Column(name = "free_shipping")
    @Builder.Default
    private Boolean freeShipping = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private ProductStatus status = ProductStatus.ACTIVE;

    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "average_rating")
    private Double averageRating;

    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;

    @Column(name = "total_sold")
    @Builder.Default
    private Integer totalSold = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── FIX: was @Transient — now persisted as JSON text in DB column ──────
    @Column(name = "images", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @Column(name = "specifications", columnDefinition = "TEXT")
    @Convert(converter = StringMapConverter.class)
    @Builder.Default
    private Map<String, String> specifications = new HashMap<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Alias methods for backward compatibility
    public Integer getStockQuantity() { return stock; }
    public void setStockQuantity(Integer stockQuantity) { this.stock = stockQuantity; }
    public Double getRating() { return averageRating; }
    public void setRating(Double rating) { this.averageRating = rating; }
    public Integer getReviewCount() { return totalReviews; }
    public void setReviewCount(Integer reviewCount) { this.totalReviews = reviewCount; }

    public enum ProductStatus {
        ACTIVE, INACTIVE, OUT_OF_STOCK, DISCONTINUED
    }

    public ProductStatus getProductStatus() {
        if (status != null) return status;
        if (!isActive) return ProductStatus.INACTIVE;
        if (stock == null || stock <= 0) return ProductStatus.OUT_OF_STOCK;
        return ProductStatus.ACTIVE;
    }

    // ── JPA AttributeConverters — JSON <-> TEXT column ───────────────────
    @Converter
    public static class StringListConverter implements AttributeConverter<List<String>, String> {
        private static final ObjectMapper MAPPER = new ObjectMapper();

        @Override
        public String convertToDatabaseColumn(List<String> list) {
            if (list == null || list.isEmpty()) return "[]";
            try { return MAPPER.writeValueAsString(list); }
            catch (Exception e) { return "[]"; }
        }

        @Override
        public List<String> convertToEntityAttribute(String json) {
            if (json == null || json.isBlank()) return new ArrayList<>();
            try { return MAPPER.readValue(json, new TypeReference<List<String>>() {}); }
            catch (Exception e) { return new ArrayList<>(); }
        }
    }

    @Converter
    public static class StringMapConverter implements AttributeConverter<Map<String, String>, String> {
        private static final ObjectMapper MAPPER = new ObjectMapper();

        @Override
        public String convertToDatabaseColumn(Map<String, String> map) {
            if (map == null || map.isEmpty()) return "{}";
            try { return MAPPER.writeValueAsString(map); }
            catch (Exception e) { return "{}"; }
        }

        @Override
        public Map<String, String> convertToEntityAttribute(String json) {
            if (json == null || json.isBlank()) return new HashMap<>();
            try { return MAPPER.readValue(json, new TypeReference<Map<String, String>>() {}); }
            catch (Exception e) { return new HashMap<>(); }
        }
    }
}