package com.shopwave.repository;

import com.shopwave.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.user.id = :userId " +
           "AND o.orderNumber = :orderNumber")
    Optional<Order> findByUserIdAndOrderNumber(
            @Param("userId") Long userId,
            @Param("orderNumber") String orderNumber);
}