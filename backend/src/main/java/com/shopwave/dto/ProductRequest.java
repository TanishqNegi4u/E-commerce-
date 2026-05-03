package com.shopwave.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(min = 3, max = 255)
    private String name;

    private String description;
    private String highlights;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01")
    private BigDecimal price;

    private BigDecimal originalPrice;
    private Integer discountPercent;

    @NotNull
    @Min(0)
    private Integer stock;

    private String brand;

    @NotNull(message = "Category is required")
    private Long categoryId;

    private List<String> images;
    private Map<String, String> specifications;
    private boolean freeShipping;
}