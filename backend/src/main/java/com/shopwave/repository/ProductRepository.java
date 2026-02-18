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
    
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);
    
    // ADDED: This is the missing method with explicit @Query
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.status = :status")
    Page<Product> findByCategoryAndStatus(@Param("categoryId") Long categoryId, 
                                          @Param("status") Product.ProductStatus status, 
                                          Pageable pageable);
    
    List<Product> findByIsFeaturedTrueAndIsActiveTrue();
    
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Product> searchProducts(@Param("query") String query);
    
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Product> searchProducts(@Param("query") String query, Pageable pageable);
    
    Page<Product> findByIsActiveTrue(Pageable pageable);
    
    Page<Product> findByCategoryIdAndIsActiveTrue(Long categoryId, Pageable pageable);
    
    List<Product> findByPriceBetweenAndIsActiveTrue(BigDecimal minPrice, BigDecimal maxPrice);
    
    List<Product> findByBrandAndIsActiveTrue(String brand);
    
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.stock <= p.lowStockThreshold")
    List<Product> findLowStockProducts();
    
    List<Product> findByStockAndIsActiveTrue(Integer stock);
    
    long countByCategoryId(Long categoryId);
    
    @Query("SELECT DISTINCT p.brand FROM Product p WHERE p.isActive = true AND p.brand IS NOT NULL")
    List<String> findAllBrands();
    
    @Query("SELECT p FROM Product p WHERE p.isActive = true ORDER BY p.totalReviews DESC, p.averageRating DESC")
    List<Product> findBestsellerProducts(Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.isFeatured = true")
    List<Product> findFeaturedProducts(Pageable pageable);
    
    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.stock = p.stock - :quantity WHERE p.id = :productId AND p.stock >= :quantity")
    int decrementStock(@Param("productId") Long productId, @Param("quantity") int quantity);
}
