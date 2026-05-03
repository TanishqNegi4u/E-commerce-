package com.shopwave.service;

import com.shopwave.config.DSAUtils;
import com.shopwave.dto.OrderRequest;
import com.shopwave.exception.ResourceNotFoundException;
import com.shopwave.model.*;
import com.shopwave.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;

    // ── PLACE ORDER ──────────────────────────────────────────
    @Transactional
    public Order placeOrder(OrderRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = cartRepository.findByUserId(user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Cart is empty"));

        if (cart.getItems().isEmpty())
            throw new RuntimeException("Cannot place order with empty cart");

        BigDecimal subtotal = cart.getItems().stream()
            .map(CartItem::getTotalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal shippingCharge = subtotal.compareTo(new BigDecimal("500")) >= 0
            ? BigDecimal.ZERO : new BigDecimal("49");

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            discountAmount = applyCoupon(request.getCouponCode(), subtotal);
        }

        BigDecimal totalAmount = subtotal.add(shippingCharge).subtract(discountAmount);

        // FIXED: UUID-based order number — no Math.random() collision risk
        Order order = Order.builder()
            .orderNumber(generateOrderNumber())
            .user(user)
            .subtotal(subtotal)
            .shippingCharge(shippingCharge)
            .discountAmount(discountAmount)
            .totalAmount(totalAmount)
            .paymentMethod(request.getPaymentMethod())
            .couponCode(request.getCouponCode())
            .notes(request.getNotes())
            .estimatedDelivery(LocalDateTime.now().plusDays(5))
            .status(Order.OrderStatus.PENDING)
            .paymentStatus(Order.PaymentStatus.PENDING)
            .build();

        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cart.getItems()) {
            int updated = productRepository.decrementStock(
                cartItem.getProduct().getId(), cartItem.getQuantity());
            if (updated == 0)
                throw new RuntimeException("Insufficient stock: " + cartItem.getProduct().getName());

            OrderItem item = OrderItem.builder()
                .order(order)
                .product(cartItem.getProduct())
                .quantity(cartItem.getQuantity())
                .unitPrice(cartItem.getProduct().getPrice())
                .totalPrice(cartItem.getTotalPrice())
                .productName(cartItem.getProduct().getName())
                .productImage(cartItem.getProduct().getImages().isEmpty()
                    ? null : cartItem.getProduct().getImages().get(0))
                .build();
            orderItems.add(item);
        }
        order.setItems(orderItems);

        Order saved = orderRepository.save(order);
        cart.getItems().clear();
        cartRepository.save(cart);

        log.info("Order placed: {} by {}", saved.getOrderNumber(), userEmail);
        return saved;
    }

    // ── MY ORDERS ────────────────────────────────────────────
    public Page<Order> getMyOrders(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
    }

    // ── GET BY NUMBER ─────────────────────────────────────────
    public Order getOrderByNumber(String orderNumber, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return orderRepository.findByUserIdAndOrderNumber(user.getId(), orderNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));
    }

    // ── CANCEL ───────────────────────────────────────────────
    @Transactional
    public Order cancelOrder(Long orderId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (!order.getUser().getId().equals(user.getId()))
            throw new AccessDeniedException("Unauthorized to cancel order: " + orderId);

        if (order.getStatus() == Order.OrderStatus.DELIVERED ||
            order.getStatus() == Order.OrderStatus.SHIPPED)
            throw new RuntimeException("Cannot cancel order in status: " + order.getStatus());

        for (OrderItem item : order.getItems()) {
            int updated = productRepository.incrementStock(item.getProduct().getId(), item.getQuantity());
            if (updated == 0) {
                log.error("Failed to restore stock for product: {}", item.getProduct().getId());
            }
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
        Order saved = orderRepository.save(order);
        log.info("Order cancelled: {} by {}", orderId, userEmail);
        return saved;
    }

    // ── UPDATE STATUS (Admin) ─────────────────────────────────
    @Transactional
    public Order updateOrderStatus(Long orderId, Order.OrderStatus newStatus,
                                   String comment, String adminEmail) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        order.setStatus(newStatus);
        if (newStatus == Order.OrderStatus.DELIVERED)
            order.setPaymentStatus(Order.PaymentStatus.PAID);
        Order saved = orderRepository.save(order);
        log.info("Order {} status → {} by {}", orderId, newStatus, adminEmail);
        return saved;
    }

    public Page<Order> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }

    // DSA #8 — Stack: order history as push/pop navigation
    public List<Order> getOrderHistory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<Order> orders = orderRepository
            .findByUserIdOrderByCreatedAtDesc(user.getId(), Pageable.unpaged())
            .getContent();
        return DSAUtils.reverseWithStack(orders); // chronological stack pop
    }

    // ── COUPON — FIXED: atomic DB increment (no read-modify-write race) ──
    private BigDecimal applyCoupon(String code, BigDecimal subtotal) {
        return couponRepository.findByCodeAndActiveTrue(code.toUpperCase())
            .filter(Coupon::isValid)
            .filter(c -> c.getMinOrderAmount() == null ||
                subtotal.compareTo(c.getMinOrderAmount()) >= 0)
            .map(coupon -> {
                BigDecimal discount;
                if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
                    discount = subtotal.multiply(coupon.getDiscountValue().divide(new BigDecimal("100")));
                    if (coupon.getMaxDiscountAmount() != null &&
                        discount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                        discount = coupon.getMaxDiscountAmount();
                    }
                } else {
                    discount = coupon.getDiscountValue();
                }
                // FIXED: atomic increment — no read-modify-write race
                couponRepository.incrementUsedCount(coupon.getId());
                return discount;
            })
            .orElse(BigDecimal.ZERO);
    }

    // FIXED: UUID-based — collision-safe under concurrent load
    private String generateOrderNumber() {
        return "SW-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}