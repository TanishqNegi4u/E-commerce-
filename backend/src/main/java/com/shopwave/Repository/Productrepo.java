package com.shopwave.repository;

import com.shopwave.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySlug(String slug);

    // FIXED: findBySku — eliminates full table scan fallback in ProductService
    // Backed by UNIQUE INDEX idx_products_sku (see V1 migration)
    Optional<Product> findBySku(String sku);

    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.status = :status")
    Page<Product> findByCategoryAndStatus(@Param("categoryId") Long categoryId,
                                          @Param("status") Product.ProductStatus status,
                                          Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Product> searchProducts(@Param("query") String query, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true ORDER BY p.totalReviews DESC, p.averageRating DESC")
    List<Product> findBestsellerProducts(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.isFeatured = true")
    List<Product> findFeaturedProducts(Pageable pageable);

    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.stock = p.stock - :quantity WHERE p.id = :productId AND p.stock >= :quantity")
    int decrementStock(@Param("productId") Long productId, @Param("quantity") int quantity);

    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.stock = p.stock + :quantity WHERE p.id = :productId")
    int incrementStock(@Param("productId") Long productId, @Param("quantity") int quantity);
}