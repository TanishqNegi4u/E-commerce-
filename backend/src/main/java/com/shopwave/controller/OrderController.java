package com.shopwave.controller;

import com.shopwave.dto.OrderRequest;
import com.shopwave.model.Order;
import com.shopwave.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order management APIs")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Place an order from cart")
    public ResponseEntity<Order> placeOrder(
            @Valid @RequestBody OrderRequest request,
            Authentication auth) {
        Order order = orderService.placeOrder(request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping
    @Operation(summary = "Get my orders")
    public ResponseEntity<Page<Order>> getMyOrders(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size,
            Sort.by("createdAt").descending());
        return ResponseEntity.ok(
            orderService.getMyOrders(auth.getName(), pageable));
    }

    @GetMapping("/{orderNumber}")
    @Operation(summary = "Get order by order number")
    public ResponseEntity<Order> getOrder(
            @PathVariable String orderNumber,
            Authentication auth) {
        return ResponseEntity.ok(
            orderService.getOrderByNumber(orderNumber, auth.getName()));
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Cancel an order")
    public ResponseEntity<Order> cancelOrder(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(
            orderService.cancelOrder(id, auth.getName()));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Update order status (Admin only)")
    public ResponseEntity<Order> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        Order.OrderStatus status =
            Order.OrderStatus.valueOf(body.get("status"));
        String comment = body.getOrDefault("comment", "");
        return ResponseEntity.ok(
            orderService.updateOrderStatus(id, status, comment, auth.getName()));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get all orders (Admin only)")
    public ResponseEntity<Page<Order>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
            Sort.by("createdAt").descending());
        return ResponseEntity.ok(orderService.getAllOrders(pageable));
    }
}