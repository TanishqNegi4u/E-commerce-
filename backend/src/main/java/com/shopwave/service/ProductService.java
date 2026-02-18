package com.shopwave.service;

import com.shopwave.config.DSAUtils;
import com.shopwave.dto.ProductRequest;
import com.shopwave.exception.ResourceNotFoundException;
import com.shopwave.model.Category;
import com.shopwave.model.Product;
import com.shopwave.model.User;
import com.shopwave.repository.CategoryRepository;
import com.shopwave.repository.ProductRepository;
import com.shopwave.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final DSAUtils dsaUtils;

    // Trie for search autocomplete (in-memory)
    private final DSAUtils.Trie searchTrie = new DSAUtils.Trie();

    // LRU Cache for recently viewed products
    private final DSAUtils.LRUCache<Long, Product> recentlyViewed =
        new DSAUtils.LRUCache<>(20);

    // HashMap for O(1) SKU lookup
    private Map<String, Product> skuIndex = new HashMap<>();

    // ============================================================
    // CREATE PRODUCT
    // ============================================================
    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public Product createProduct(ProductRequest request, String sellerEmail) {
        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() ->
                new ResourceNotFoundException("Category not found"));
        User seller = userRepository.findByEmail(sellerEmail)
            .orElseThrow(() ->
                new ResourceNotFoundException("Seller not found"));

        Product product = Product.builder()
            .name(request.getName())
            .description(request.getDescription())
            .highlights(request.getHighlights())
            .price(request.getPrice())
            .originalPrice(request.getOriginalPrice())
            .discountPercent(request.getDiscountPercent())
            .stock(request.getStock())
            .sku(generateSKU(request.getName()))
            .brand(request.getBrand())
            .category(category)
            .seller(seller)
            .images(request.getImages() != null
                ? request.getImages() : new ArrayList<>())
            .specifications(request.getSpecifications() != null
                ? request.getSpecifications() : new HashMap<>())
            .freeShipping(request.isFreeShipping())
            .slug(generateSlug(request.getName()))
            .build();

        Product saved = productRepository.save(product);

        // Update Trie
        searchTrie.insert(product.getName());
        if (product.getBrand() != null) searchTrie.insert(product.getBrand());

        // Update SKU index
        if (saved.getSku() != null) skuIndex.put(saved.getSku(), saved);

        log.info("Product created: {} by {}", product.getName(), sellerEmail);
        return saved;
    }

    // ============================================================
    // GET PRODUCT BY ID
    // ============================================================
    @Cacheable(value = "products", key = "#id")
    public Product getProductById(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() ->
                new ResourceNotFoundException("Product not found: " + id));
        // Store in LRU Cache
        recentlyViewed.put(id, product);
        return product;
    }

    // ============================================================
    // GET PRODUCT BY SLUG
    // ============================================================
    public Product getProductBySlug(String slug) {
        return productRepository.findBySlug(slug)
            .orElseThrow(() ->
                new ResourceNotFoundException("Product not found: " + slug));
    }

    // ============================================================
    // GET PRODUCT BY SKU — O(1) HashMap lookup
    // ============================================================
    public Product getProductBySku(String sku) {
        Product cached = skuIndex.get(sku);
        if (cached != null) return cached;
        return productRepository.findAll().stream()
            .filter(p -> sku.equals(p.getSku()))
            .findFirst()
            .orElseThrow(() ->
                new ResourceNotFoundException("Product not found: " + sku));
    }

    // ============================================================
    // RECENTLY VIEWED — LRU Cache
    // ============================================================
    public List<Product> getRecentlyViewed() {
        return recentlyViewed.getAll();
    }

    // ============================================================
    // SEARCH
    // ============================================================
    public Page<Product> searchProducts(String keyword, Pageable pageable) {
        return productRepository.searchProducts(keyword, pageable);
    }

    // Trie-based autocomplete
    public List<String> getSearchSuggestions(String prefix) {
        return searchTrie.getSuggestions(prefix, 10);
    }

    // ============================================================
    // FILTER & SORT — DSA Powered
    // ============================================================
    public Page<Product> getProductsByCategory(
            Long categoryId, Pageable pageable) {
        return productRepository.findByCategoryAndStatus(
            categoryId, Product.ProductStatus.ACTIVE, pageable);
    }

    // Merge Sort by price
    public List<Product> getSortedProductsByPrice(
            Long categoryId, boolean ascending) {
        List<Product> products = productRepository
            .findByCategoryId(categoryId, Pageable.unpaged())
            .getContent();
        return DSAUtils.mergeSortByPrice(new ArrayList<>(products), ascending);
    }

    // Merge Sort by rating
    public List<Product> getSortedProductsByRating(Long categoryId) {
        List<Product> products = productRepository
            .findByCategoryId(categoryId, Pageable.unpaged())
            .getContent();
        return DSAUtils.mergeSortByRating(new ArrayList<>(products));
    }

    // Binary Search price range filter
    public List<Product> filterByPriceRange(
            Long categoryId, BigDecimal min, BigDecimal max) {
        List<Product> sorted = getSortedProductsByPrice(categoryId, true);
        return DSAUtils.filterByPriceRange(sorted, min, max);
    }

    // Min-Heap top-K cheapest
    public List<Product> getTopKCheapest(Long categoryId, int k) {
        List<Product> products = productRepository
            .findByCategoryId(categoryId, Pageable.unpaged())
            .getContent();
        return DSAUtils.getTopKCheapest(products, k);
    }

    // ============================================================
    // FEATURED / BESTSELLER
    // ============================================================
    @Cacheable("featured-products")
    public List<Product> getFeaturedProducts() {
        return productRepository.findFeaturedProducts(
            PageRequest.of(0, 12));
    }

    @Cacheable("bestseller-products")
    public List<Product> getBestsellerProducts() {
        return productRepository.findBestsellerProducts(
            PageRequest.of(0, 20));
    }

    // ============================================================
    // UPDATE PRODUCT
    // ============================================================
    @Transactional
    @CacheEvict(value = "products", key = "#id")
    public Product updateProduct(
            Long id, ProductRequest request, String email) {
        Product product = getProductById(id);
        if (request.getName() != null) product.setName(request.getName());
        if (request.getDescription() != null)
            product.setDescription(request.getDescription());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        if (request.getOriginalPrice() != null)
            product.setOriginalPrice(request.getOriginalPrice());
        if (request.getDiscountPercent() != null)
            product.setDiscountPercent(request.getDiscountPercent());
        if (request.getStock() != null) product.setStock(request.getStock());
        if (request.getBrand() != null) product.setBrand(request.getBrand());
        if (request.getImages() != null) product.setImages(request.getImages());
        if (request.getSpecifications() != null)
            product.setSpecifications(request.getSpecifications());
        log.info("Product updated: {} by {}", id, email);
        return productRepository.save(product);
    }

    // ============================================================
    // DELETE PRODUCT
    // ============================================================
    @Transactional
    @CacheEvict(value = "products", key = "#id")
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        product.setStatus(Product.ProductStatus.DISCONTINUED);
        productRepository.save(product);
        log.info("Product discontinued: {}", id);
    }

    // ============================================================
    // STOCK MANAGEMENT
    // ============================================================
    @Transactional
    public void reduceStock(Long productId, int quantity) {
        int updated = productRepository.decrementStock(productId, quantity);
        if (updated == 0)
            throw new RuntimeException(
                "Insufficient stock for product: " + productId);
    }

    // ============================================================
    // LOAD ALL TO TRIE on startup
    // ============================================================
    public void loadAllProductsToTrie() {
        List<Product> all = productRepository.findAll();
        all.forEach(p -> {
            searchTrie.insert(p.getName());
            if (p.getBrand() != null) searchTrie.insert(p.getBrand());
        });
        skuIndex = DSAUtils.buildSkuIndex(all);
        log.info("Loaded {} products into Trie & SKU index", all.size());
    }

    // ============================================================
    // HELPERS
    // ============================================================
    private String generateSKU(String name) {
        String base = name.toUpperCase()
            .replaceAll("[^A-Z0-9]", "")
            .substring(0, Math.min(name.length(), 6));
        return base + "-" + System.currentTimeMillis() % 100000;
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("^-|-$", "");
    }
}