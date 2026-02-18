package com.shopwave.repository;

import com.shopwave.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Find by slug
    Optional<Product> findBySlug(String slug);

    // Find active products
    List<Product> findByIsActiveTrue();

    // Find by category
    List<Product> findByCategoryIdAndIsActiveTrue(Long categoryId);

    // Find featured products
    List<Product> findByIsFeaturedTrueAndIsActiveTrue();

    // Search products by name or description
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Product> searchProducts(@Param("query") String query);

    // Find products with pagination
    Page<Product> findByIsActiveTrue(Pageable pageable);

    // Find by category with pagination
    Page<Product> findByCategoryIdAndIsActiveTrue(Long categoryId, Pageable pageable);

    // Find by price range
    List<Product> findByPriceBetweenAndIsActiveTrue(BigDecimal minPrice, BigDecimal maxPrice);

    // Find by brand
    List<Product> findByBrandAndIsActiveTrue(String brand);

    // Find low stock products
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.stockQuantity <= p.lowStockThreshold")
    List<Product> findLowStockProducts();

    // Find out of stock products
    List<Product> findByStockQuantityAndIsActiveTrue(Integer stockQuantity);

    // Count products by category
    long countByCategoryId(Long categoryId);

    // Get all distinct brands
    @Query("SELECT DISTINCT p.brand FROM Product p WHERE p.isActive = true AND p.brand IS NOT NULL")
    List<String> findAllBrands();
}
