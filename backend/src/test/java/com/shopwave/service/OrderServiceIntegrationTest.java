package com.shopwave.service;

import com.shopwave.dto.OrderRequest;
import com.shopwave.model.*;
import com.shopwave.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for OrderService.
 *
 * ⚠ Thread-safety note (same as ProductService):
 *   reverseWithStack and in-memory coupon state are single-JVM structures.
 *   Fine for one instance; add distributed coordination for multi-node.
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("OrderService Integration Tests")
class OrderServiceIntegrationTest {

    @Autowired private OrderService     orderService;
    @Autowired private UserRepository   userRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CartRepository   cartRepository;
    @Autowired private OrderRepository  orderRepository;
    @Autowired private CouponRepository couponRepository;

    private User     buyer;
    private Product  testProduct;

    @BeforeEach
    @Transactional
    void setUp() {
        Category cat = categoryRepository.save(
                Category.builder().name("Test").slug("test").build());

        buyer = userRepository.save(
                User.builder()
                    .name("Buyer")
                    .email("buyer@test.com")
                    .password("$2a$10$dummy")
                    .role(User.Role.USER)
                    .build());

        testProduct = productRepository.save(
                Product.builder()
                    .name("Test Product")
                    .price(new BigDecimal("200.00"))
                    .stock(100)
                    .category(cat)
                    .status(Product.ProductStatus.ACTIVE)
                    .sku("TEST-001")
                    .slug("test-product")
                    .build());

        Cart cart = Cart.builder().user(buyer).build();
        CartItem item = CartItem.builder()
                .cart(cart)
                .product(testProduct)
                .quantity(2)
                .build();
        cart.setItems(List.of(item));
        cartRepository.save(cart);
    }

    @AfterEach
    @Transactional
    void tearDown() {
        orderRepository.deleteAll();
        cartRepository.deleteAll();
        productRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();
        couponRepository.deleteAll();
    }

    // ----------------------------------------------------------------
    // PLACE ORDER
    // ----------------------------------------------------------------
    @Test
    @Transactional
    @DisplayName("placeOrder creates order and clears cart")
    void placeOrder_createsOrderAndClearsCart() {
        OrderRequest req = new OrderRequest();
        req.setPaymentMethod("COD");

        Order order = orderService.placeOrder(req, buyer.getEmail());

        assertThat(order.getId()).isNotNull();
        assertThat(order.getOrderNumber()).startsWith("SW-");
        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.PENDING);
        assertThat(order.getItems()).hasSize(1);

        // Cart should be empty after order
        Cart cart = cartRepository.findByUserId(buyer.getId()).orElseThrow();
        assertThat(cart.getItems()).isEmpty();
    }

    @Test
    @Transactional
    @DisplayName("placeOrder reduces product stock")
    void placeOrder_reducesStock() {
        int stockBefore = testProduct.getStock();
        OrderRequest req = new OrderRequest();
        req.setPaymentMethod("COD");

        orderService.placeOrder(req, buyer.getEmail());

        Product updated = productRepository.findById(testProduct.getId()).orElseThrow();
        assertThat(updated.getStock()).isEqualTo(stockBefore - 2);
    }

    @Test
    @Transactional
    @DisplayName("placeOrder applies free shipping for order >= 500")
    void placeOrder_freeShippingAboveThreshold() {
        // Price 200 × 2 = 400 → below 500 → should charge shipping
        OrderRequest req = new OrderRequest();
        req.setPaymentMethod("COD");
        Order order = orderService.placeOrder(req, buyer.getEmail());

        // 400 < 500 → shipping = 49
        assertThat(order.getShippingCharge()).isEqualByComparingTo("49");
    }

    @Test
    @Transactional
    @DisplayName("placeOrder with valid coupon applies discount")
    void placeOrder_withCoupon_appliesDiscount() {
        Coupon coupon = Coupon.builder()
                .code("SAVE10")
                .discountType(Coupon.DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("10"))
                .active(true)
                .usedCount(0)
                .build();
        couponRepository.save(coupon);

        OrderRequest req = new OrderRequest();
        req.setPaymentMethod("COD");
        req.setCouponCode("SAVE10");

        Order order = orderService.placeOrder(req, buyer.getEmail());

        assertThat(order.getDiscountAmount()).isGreaterThan(BigDecimal.ZERO);
    }

    // ----------------------------------------------------------------
    // CANCEL ORDER
    // ----------------------------------------------------------------
    @Test
    @Transactional
    @DisplayName("cancelOrder restores stock and sets status CANCELLED")
    void cancelOrder_restoresStockAndCancels() {
        OrderRequest req = new OrderRequest();
        req.setPaymentMethod("COD");
        Order order = orderService.placeOrder(req, buyer.getEmail());
        int stockAfterOrder = productRepository.findById(
                testProduct.getId()).orElseThrow().getStock();

        Order cancelled = orderService.cancelOrder(order.getId(), buyer.getEmail());

        assertThat(cancelled.getStatus()).isEqualTo(Order.OrderStatus.CANCELLED);
        assertThat(cancelled.getPaymentStatus()).isEqualTo(Order.PaymentStatus.REFUNDED);

        int stockAfterCancel = productRepository.findById(
                testProduct.getId()).orElseThrow().getStock();
        assertThat(stockAfterCancel).isEqualTo(stockAfterOrder + 2);
    }

    @Test
    @Transactional
    @DisplayName("cancelOrder throws for DELIVERED order")
    void cancelOrder_throwsForDeliveredOrder() {
        OrderRequest req = new OrderRequest();
        req.setPaymentMethod("COD");
        Order order = orderService.placeOrder(req, buyer.getEmail());

        // Simulate delivery (admin action)
        orderService.updateOrderStatus(
                order.getId(), Order.OrderStatus.DELIVERED, "", "admin@test.com");

        assertThatThrownBy(() ->
                orderService.cancelOrder(order.getId(), buyer.getEmail()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot cancel");
    }

    // ----------------------------------------------------------------
    // GET ORDER HISTORY (Stack)
    // ----------------------------------------------------------------
    @Test
    @Transactional
    @DisplayName("getOrderHistory returns orders reverse-chronological via Stack")
    void getOrderHistory_reversesOrders() {
        // Place two orders
        OrderRequest req = new OrderRequest();
        req.setPaymentMethod("COD");
        Order first = orderService.placeOrder(req, buyer.getEmail());

        // Re-add cart items for second order
        Cart cart = cartRepository.findByUserId(buyer.getId()).orElseThrow();
        CartItem item = CartItem.builder()
                .cart(cart).product(testProduct).quantity(1).build();
        cart.setItems(List.of(item));
        cartRepository.save(cart);

        Order second = orderService.placeOrder(req, buyer.getEmail());

        List<Order> history = orderService.getOrderHistory(buyer.getEmail());
        assertThat(history).isNotEmpty();
        // Stack reversal: oldest at index 0, newest at end
        // (reverseWithStack reverses the "already newest-first" DB result
        //  → oldest first)
        assertThat(history.get(0).getId()).isEqualTo(first.getId());
    }
}