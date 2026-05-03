package com.shopwave.service;

import com.shopwave.dto.ProductRequest;
import com.shopwave.model.Category;
import com.shopwave.model.Product;
import com.shopwave.model.User;
import com.shopwave.repository.CategoryRepository;
import com.shopwave.repository.ProductRepository;
import com.shopwave.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for ProductService.
 *
 * ⚠ Thread-safety / multi-instance note:
 *   ProductService keeps a Trie, LRU cache, and SKU index in JVM heap.
 *   These structures are not shared across instances (pods / containers).
 *   In a horizontally-scaled deployment each instance builds its own
 *   in-memory state on startup. Migrate to Redis or a DB-backed store
 *   before deploying more than one replica.
 *
 * These tests run against an H2 in-memory database (profile = "test").
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("ProductService Integration Tests")
class ProductServiceIntegrationTest {

    @Autowired private ProductService  productService;
    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private UserRepository   userRepository;

    private Category testCategory;
    private User     testSeller;

    @BeforeEach
    void setUp() {
        testCategory = categoryRepository.save(
                Category.builder().name("Electronics").slug("electronics").build());

        testSeller = userRepository.save(
                User.builder()
                    .name("Test Seller")
                    .email("seller@test.com")
                    .password("$2a$10$dummyHashedPasswordForTests")
                    .role(User.Role.SELLER)
                    .build());
    }

    // ----------------------------------------------------------------
    // CREATE
    // ----------------------------------------------------------------
    @Test
    @DisplayName("createProduct persists product and indexes SKU")
    void createProduct_persistsAndIndexesSku() {
        ProductRequest req = buildRequest("Wireless Mouse", new BigDecimal("29.99"));
        Product created = productService.createProduct(req, testSeller.getEmail());

        assertThat(created.getId()).isNotNull();
        assertThat(created.getName()).isEqualTo("Wireless Mouse");
        assertThat(created.getSku()).isNotBlank();

        // Verify it's persisted
        assertThat(productRepository.findById(created.getId())).isPresent();
    }

    @Test
    @DisplayName("createProduct adds name to Trie for autocomplete")
    void createProduct_addsToTrie() {
        ProductRequest req = buildRequest("Mechanical Keyboard", new BigDecimal("79.99"));
        productService.createProduct(req, testSeller.getEmail());

        List<String> suggestions = productService.getSearchSuggestions("mech");
        assertThat(suggestions).anyMatch(s ->
                s.toLowerCase().contains("mechanical"));
    }

    // ----------------------------------------------------------------
    // READ
    // ----------------------------------------------------------------
    @Test
    @DisplayName("getProductById returns product and adds to LRU cache")
    void getProductById_returnsAndCaches() {
        Product saved = createAndSave("USB Hub", "19.99");

        Product fetched = productService.getProductById(saved.getId());
        assertThat(fetched.getName()).isEqualTo("USB Hub");

        // LRU cache should now contain it
        List<Product> recentlyViewed = productService.getRecentlyViewed();
        assertThat(recentlyViewed).extracting(Product::getId)
                .contains(saved.getId());
    }

    @Test
    @DisplayName("getProductBySku returns correct product via O(1) index")
    void getProductBySku_returnsCorrectProduct() {
        Product saved = createAndSave("SSD Drive", "89.99");
        Product bySku = productService.getProductBySku(saved.getSku());
        assertThat(bySku.getId()).isEqualTo(saved.getId());
    }

    // ----------------------------------------------------------------
    // SORT & FILTER (DSA)
    // ----------------------------------------------------------------
    @Test
    @DisplayName("getSortedProductsByPrice returns products in ascending order")
    void getSortedByPrice_ascending() {
        createAndSave("Expensive Item", "999.00");
        createAndSave("Cheap Item",     "9.99");
        createAndSave("Mid Item",       "49.99");

        List<Product> sorted = productService.getSortedProductsByPrice(
                testCategory.getId(), true);

        List<Double> prices = sorted.stream()
                .map(p -> p.getPrice().doubleValue())
                .toList();
        assertThat(prices).isSorted();
    }

    @Test
    @DisplayName("filterByPriceRange returns only products within bounds")
    void filterByPriceRange_withinBounds() {
        createAndSave("Item10", "10.00");
        createAndSave("Item50", "50.00");
        createAndSave("Item100", "100.00");

        List<Product> filtered = productService.filterByPriceRange(
                testCategory.getId(),
                new BigDecimal("20"),
                new BigDecimal("75"));

        assertThat(filtered).allMatch(p ->
                p.getPrice().compareTo(new BigDecimal("20")) >= 0 &&
                p.getPrice().compareTo(new BigDecimal("75")) <= 0);
    }

    @Test
    @DisplayName("getTopKCheapest returns K cheapest products")
    void getTopKCheapest_returnsK() {
        createAndSave("P1", "1.00");
        createAndSave("P2", "2.00");
        createAndSave("P3", "3.00");
        createAndSave("P4", "4.00");

        List<Product> top2 = productService.getTopKCheapest(testCategory.getId(), 2);
        assertThat(top2).hasSize(2);
        assertThat(top2).extracting(p -> p.getPrice().doubleValue())
                .containsExactlyInAnyOrder(1.0, 2.0);
    }

    // ----------------------------------------------------------------
    // SEARCH
    // ----------------------------------------------------------------
    @Test
    @DisplayName("searchProducts returns matching results")
    void searchProducts_returnsMatches() {
        createAndSave("Gaming Mouse", "45.00");
        createAndSave("Gaming Keyboard", "90.00");
        createAndSave("Office Chair", "200.00");

        Page<Product> results = productService.searchProducts(
                "Gaming", PageRequest.of(0, 10));

        assertThat(results.getContent())
                .extracting(Product::getName)
                .allMatch(name -> name.contains("Gaming"));
    }

    // ----------------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------------
    @Test
    @DisplayName("updateProduct changes price correctly")
    void updateProduct_changesPrice() {
        Product saved = createAndSave("Old Widget", "25.00");

        ProductRequest update = new ProductRequest();
        update.setPrice(new BigDecimal("35.00"));

        Product updated = productService.updateProduct(
                saved.getId(), update, testSeller.getEmail());

        assertThat(updated.getPrice()).isEqualByComparingTo("35.00");
    }

    // ----------------------------------------------------------------
    // DELETE (soft)
    // ----------------------------------------------------------------
    @Test
    @DisplayName("deleteProduct soft-deletes (status = DISCONTINUED)")
    void deleteProduct_softDeletes() {
        Product saved = createAndSave("Obsolete Device", "5.00");
        productService.deleteProduct(saved.getId());

        Product found = productRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.getStatus()).isEqualTo(Product.ProductStatus.DISCONTINUED);
    }

    // ----------------------------------------------------------------
    // STOCK
    // ----------------------------------------------------------------
    @Test
    @DisplayName("reduceStock decrements stock correctly")
    void reduceStock_decrementsCorrectly() {
        Product saved = createAndSave("Limited Stock Item", "15.00");
        int initialStock = saved.getStock(); // default set in builder

        productService.reduceStock(saved.getId(), 1);

        Product updated = productRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getStock()).isEqualTo(initialStock - 1);
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------
    private ProductRequest buildRequest(String name, BigDecimal price) {
        ProductRequest req = new ProductRequest();
        req.setName(name);
        req.setDescription("Test description for " + name);
        req.setPrice(price);
        req.setOriginalPrice(price);
        req.setStock(50);
        req.setCategoryId(testCategory.getId());
        req.setBrand("TestBrand");
        return req;
    }

    private Product createAndSave(String name, String price) {
        return productService.createProduct(
                buildRequest(name, new BigDecimal(price)),
                testSeller.getEmail());
    }
}