package com.shopwave.repository;

import com.shopwave.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySlug(String slug);

    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchProducts(@Param("keyword") String keyword,
                                 Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId " +
           "AND p.status = :status")
    Page<Product> findByCategoryAndStatus(
            @Param("categoryId") Long categoryId,
            @Param("status") Product.ProductStatus status,
            Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId " +
           "AND p.status = 'ACTIVE'")
    Page<Product> findByCategoryId(@Param("categoryId") Long categoryId,
                                   Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.featured = true " +
           "AND p.status = 'ACTIVE' ORDER BY p.createdAt DESC")
    List<Product> findFeaturedProducts(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' " +
           "ORDER BY p.totalSold DESC")
    List<Product> findBestsellerProducts(Pageable pageable);

    @Modifying
    @Query("UPDATE Product p SET p.stock = p.stock - :qty " +
           "WHERE p.id = :id AND p.stock >= :qty")
    int decrementStock(@Param("id") Long id, @Param("qty") int qty);
}