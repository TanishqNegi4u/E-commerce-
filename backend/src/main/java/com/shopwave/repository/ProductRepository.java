package com.shopwave.repository;

import com.shopwave.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySlug(String slug);
    
    List<Product> findByIsActiveTrue();
    
    List<Product> findByCategoryIdAndIsActiveTrue(Long categoryId);
    
    List<Product> findByIsFeaturedTrueAndIsActiveTrue();
    
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Product> searchProducts(@Param("query") String query);
    
    Page<Product> findByIsActiveTrue(Pageable pageable);
    
    Page<Product> findByCategoryIdAndIsActiveTrue(Long categoryId, Pageable pageable);
    
    List<Product> findByPriceBetweenAndIsActiveTrue(BigDecimal minPrice, BigDecimal maxPrice);
    
    List<Product> findByBrandAndIsActiveTrue(String brand);
    
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.stockQuantity <= p.lowStockThreshold")
    List<Product> findLowStockProducts();
    
    List<Product> findByStockQuantityAndIsActiveTrue(Integer stockQuantity);
    
    long countByCategoryId(Long categoryId);
    
    @Query("SELECT DISTINCT p.brand FROM Product p WHERE p.isActive = true AND p.brand IS NOT NULL")
    List<String> findAllBrands();
    
    // Bestseller products (ordered by review count and rating)
    @Query("SELECT p FROM Product p WHERE p.isActive = true ORDER BY p.reviewCount DESC, p.rating DESC")
    List<Product> findBestsellerProducts(Pageable pageable);
    
    // Decrement stock
    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity - :quantity WHERE p.id = :productId AND p.stockQuantity >= :quantity")
    int decrementStock(@Param("productId") Long productId, @Param("quantity") int quantity);
}