package com.shopwave.repository;

import com.shopwave.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    // FIX: was plain findByUserId — caused N+1 (one query per CartItem to load product)
    // JOIN FETCH loads cart + all items + their products in a single SQL query
    @Query("SELECT c FROM Cart c LEFT JOIN FETCH c.items i LEFT JOIN FETCH i.product WHERE c.user.id = :userId")
    Optional<Cart> findByUserId(@Param("userId") Long userId);
}