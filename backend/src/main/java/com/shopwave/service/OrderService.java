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

    // ============================================================
    // PLACE ORDER
    // ============================================================
    @Transactional
    public Order placeOrder(OrderRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() ->
                new ResourceNotFoundException("User not found"));

        Cart cart = cartRepository.findByUserId(user.getId())
            .orElseThrow(() ->
                new ResourceNotFoundException("Cart is empty"));

        if (cart.getItems().isEmpty())
            throw new RuntimeException("Cannot place order with empty cart");

        // Calculate subtotal
        BigDecimal subtotal = cart.getItems().stream()
            .map(CartItem::getTotalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Shipping charge
        BigDecimal shippingCharge = subtotal.compareTo(
            new BigDecimal("500")) >= 0
            ? BigDecimal.ZERO
            : new BigDecimal("49");

        // Apply coupon if provided
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getCouponCode() != null
                && !request.getCouponCode().isEmpty()) {
            discountAmount = applyCoupon(
                request.getCouponCode(), subtotal);
        }

        BigDecimal totalAmount = subtotal
            .add(shippingCharge)
            .subtract(discountAmount);

        // Build order
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

        // Add order items
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cart.getItems()) {
            int updated = productRepository.decrementStock(
                cartItem.getProduct().getId(), cartItem.getQuantity());
            if (updated == 0)
                throw new RuntimeException(
                    "Insufficient stock: " + cartItem.getProduct().getName());

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

        // Clear cart after order
        cart.getItems().clear();
        cartRepository.save(cart);

        log.info("Order placed: {} by {}", saved.getOrderNumber(), userEmail);
        return saved;
    }

    // ============================================================
    // GET MY ORDERS
    // ============================================================
    public Page<Order> getMyOrders(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() ->
                new ResourceNotFoundException("User not found"));
        return orderRepository.findByUserIdOrderByCreatedAtDesc(
            user.getId(), pageable);
    }

    // ============================================================
    // GET ORDER BY NUMBER
    // ============================================================
    public Order getOrderByNumber(String orderNumber, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() ->
                new ResourceNotFoundException("User not found"));
        return orderRepository
            .findByUserIdAndOrderNumber(user.getId(), orderNumber)
            .orElseThrow(() ->
                new ResourceNotFoundException("Order not found: " + orderNumber));
    }

    // ============================================================
    // CANCEL ORDER
    // ============================================================
    @Transactional
    public Order cancelOrder(Long orderId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() ->
                new ResourceNotFoundException("User not found"));

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() ->
                new ResourceNotFoundException("Order not found: " + orderId));

        if (!order.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized to cancel this order");

        if (order.getStatus() == Order.OrderStatus.DELIVERED ||
            order.getStatus() == Order.OrderStatus.SHIPPED)
            throw new RuntimeException(
                "Cannot cancel order in status: " + order.getStatus());

        // Restore stock
        for (OrderItem item : order.getItems()) {
            productRepository.findById(item.getProduct().getId())
                .ifPresent(p -> {
                    p.setStock(p.getStock() + item.getQuantity());
                    productRepository.save(p);
                });
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
        Order saved = orderRepository.save(order);
        log.info("Order cancelled: {} by {}", orderId, userEmail);
        return saved;
    }

    // ============================================================
    // UPDATE ORDER STATUS — Admin only
    // ============================================================
    @Transactional
    public Order updateOrderStatus(Long orderId,
                                   Order.OrderStatus newStatus,
                                   String comment,
                                   String adminEmail) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() ->
                new ResourceNotFoundException("Order not found: " + orderId));

        Order.OrderStatus oldStatus = order.getStatus();
        order.setStatus(newStatus);

        if (newStatus == Order.OrderStatus.DELIVERED) {
            order.setPaymentStatus(Order.PaymentStatus.PAID);
        }

        Order saved = orderRepository.save(order);
        log.info("Order {} status changed: {} -> {} by {}",
            orderId, oldStatus, newStatus, adminEmail);
        return saved;
    }

    // ============================================================
    // GET ALL ORDERS — Admin only
    // ============================================================
    public Page<Order> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }

    // ============================================================
    // GET ORDER HISTORY — Stack (reverse chronological)
    // ============================================================
    public List<Order> getOrderHistory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() ->
                new ResourceNotFoundException("User not found"));
        List<Order> orders = orderRepository
            .findByUserIdOrderByCreatedAtDesc(
                user.getId(), Pageable.unpaged())
            .getContent();
        return DSAUtils.reverseWithStack(orders);
    }

    // ============================================================
    // APPLY COUPON
    // ============================================================
    private BigDecimal applyCoupon(String code, BigDecimal subtotal) {
        return couponRepository.findByCodeAndActiveTrue(code)
            .filter(Coupon::isValid)
            .filter(c -> c.getMinOrderAmount() == null ||
                subtotal.compareTo(c.getMinOrderAmount()) >= 0)
            .map(coupon -> {
                BigDecimal discount;
                if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
                    discount = subtotal.multiply(
                        coupon.getDiscountValue()
                            .divide(new BigDecimal("100")));
                    if (coupon.getMaxDiscountAmount() != null &&
                        discount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                        discount = coupon.getMaxDiscountAmount();
                    }
                } else {
                    discount = coupon.getDiscountValue();
                }
                coupon.setUsedCount(coupon.getUsedCount() + 1);
                couponRepository.save(coupon);
                return discount;
            })
            .orElse(BigDecimal.ZERO);
    }

    // ============================================================
    // GENERATE ORDER NUMBER
    // ============================================================
    private String generateOrderNumber() {
        return "SW-" + System.currentTimeMillis()
            + "-" + (int)(Math.random() * 9000 + 1000);
    }
}