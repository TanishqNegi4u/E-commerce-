package com.shopwave.config;

import com.shopwave.model.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for DSAUtils.
 *
 * Thread-safety note: Trie, LRUCache, ProductGraph, and skuIndex are
 * NOT thread-safe. In a multi-instance / clustered deployment every
 * JVM starts with an empty in-memory state. Use a distributed cache
 * (Redis) or a database-backed equivalent before going multi-node.
 */
@DisplayName("DSAUtils Unit Tests")
class DSAUtilsTest {

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------
    private static Product product(String name, double price) {
        Product p = new Product();
        p.setName(name);
        p.setPrice(BigDecimal.valueOf(price));
        return p;
    }

    private static Product product(String name, double price, double rating) {
        Product p = product(name, price);
        p.setAverageRating(rating);
        return p;
    }

    private static Product productWithSku(String name, String sku) {
        Product p = new Product();
        p.setName(name);
        p.setPrice(BigDecimal.ONE);
        p.setSku(sku);
        return p;
    }

    // ================================================================
    // 1. TRIE
    // ================================================================
    @Nested
    @DisplayName("Trie — autocomplete")
    class TrieTests {

        private DSAUtils.Trie trie;

        @BeforeEach
        void setUp() {
            trie = new DSAUtils.Trie();
            trie.insert("apple");
            trie.insert("application");
            trie.insert("apply");
            trie.insert("banana");
        }

        @Test
        @DisplayName("returns suggestions for valid prefix")
        void suggestions_validPrefix() {
            List<String> results = trie.getSuggestions("app", 10);
            assertThat(results).containsExactlyInAnyOrder("apple", "application", "apply");
        }

        @Test
        @DisplayName("respects limit parameter")
        void suggestions_respectsLimit() {
            List<String> results = trie.getSuggestions("app", 2);
            assertThat(results).hasSize(2);
        }

        @Test
        @DisplayName("returns empty list for unknown prefix")
        void suggestions_unknownPrefix() {
            assertThat(trie.getSuggestions("xyz", 10)).isEmpty();
        }

        @Test
        @DisplayName("handles null prefix gracefully")
        void suggestions_nullPrefix() {
            assertThat(trie.getSuggestions(null, 10)).isEmpty();
        }

        @Test
        @DisplayName("handles empty prefix gracefully")
        void suggestions_emptyPrefix() {
            assertThat(trie.getSuggestions("", 10)).isEmpty();
        }

        @Test
        @DisplayName("insert is case-insensitive")
        void insert_caseInsensitive() {
            trie.insert("Mango");
            assertThat(trie.getSuggestions("man", 5))
                    .anyMatch(s -> s.equalsIgnoreCase("mango"));
        }

        @Test
        @DisplayName("exact-match word is included in results")
        void suggestions_exactMatch() {
            assertThat(trie.getSuggestions("banana", 10)).contains("banana");
        }
    }

    // ================================================================
    // 2. MERGE SORT — by price
    // ================================================================
    @Nested
    @DisplayName("MergeSort — by price")
    class MergeSortByPriceTests {

        @Test
        @DisplayName("sorts ascending")
        void ascending() {
            List<Product> products = List.of(
                    product("C", 30), product("A", 10), product("B", 20));
            List<Product> sorted = DSAUtils.mergeSortByPrice(
                    new ArrayList<>(products), true);
            assertThat(sorted).extracting(p -> p.getPrice().doubleValue())
                    .isSorted();
        }

        @Test
        @DisplayName("sorts descending")
        void descending() {
            List<Product> products = List.of(
                    product("A", 10), product("C", 30), product("B", 20));
            List<Product> sorted = DSAUtils.mergeSortByPrice(
                    new ArrayList<>(products), false);
            assertThat(sorted.get(0).getPrice().doubleValue()).isEqualTo(30.0);
            assertThat(sorted.get(2).getPrice().doubleValue()).isEqualTo(10.0);
        }

        @Test
        @DisplayName("handles single-element list")
        void singleElement() {
            List<Product> single = List.of(product("X", 99));
            assertThat(DSAUtils.mergeSortByPrice(new ArrayList<>(single), true))
                    .hasSize(1);
        }

        @Test
        @DisplayName("handles empty list")
        void emptyList() {
            assertThat(DSAUtils.mergeSortByPrice(new ArrayList<>(), true)).isEmpty();
        }

        @Test
        @DisplayName("preserves all elements (no data loss)")
        void preservesAllElements() {
            List<Product> products = List.of(
                    product("A", 5), product("B", 3), product("C", 8),
                    product("D", 1), product("E", 9));
            List<Product> sorted = DSAUtils.mergeSortByPrice(
                    new ArrayList<>(products), true);
            assertThat(sorted).hasSameSizeAs(products);
        }
    }

    // ================================================================
    // 3. MERGE SORT — by rating
    // ================================================================
    @Nested
    @DisplayName("MergeSort — by rating")
    class MergeSortByRatingTests {

        @Test
        @DisplayName("sorts highest rating first")
        void highestFirst() {
            List<Product> products = List.of(
                    product("A", 10, 3.0),
                    product("B", 20, 5.0),
                    product("C", 15, 4.0));
            List<Product> sorted = DSAUtils.mergeSortByRating(new ArrayList<>(products));
            assertThat(sorted.get(0).getAverageRating()).isEqualTo(5.0);
            assertThat(sorted.get(2).getAverageRating()).isEqualTo(3.0);
        }

        @Test
        @DisplayName("treats null rating as 0")
        void nullRating() {
            Product withRating    = product("A", 10, 4.0);
            Product withoutRating = product("B", 5);   // no rating set
            List<Product> sorted = DSAUtils.mergeSortByRating(
                    new ArrayList<>(List.of(withoutRating, withRating)));
            assertThat(sorted.get(0)).isEqualTo(withRating);
        }
    }

    // ================================================================
    // 4. BINARY SEARCH — price range filter
    // ================================================================
    @Nested
    @DisplayName("BinarySearch — filterByPriceRange")
    class BinarySearchTests {

        private List<Product> sorted;

        @BeforeEach
        void setUp() {
            // Already sorted ascending
            sorted = new ArrayList<>(List.of(
                    product("A", 10), product("B", 20),
                    product("C", 30), product("D", 40), product("E", 50)));
        }

        @Test
        @DisplayName("returns products within [min, max]")
        void inRange() {
            List<Product> result = DSAUtils.filterByPriceRange(
                    sorted, BigDecimal.valueOf(20), BigDecimal.valueOf(40));
            assertThat(result).extracting(p -> p.getPrice().intValue())
                    .containsExactly(20, 30, 40);
        }

        @Test
        @DisplayName("returns empty when range has no matches")
        void noMatches() {
            List<Product> result = DSAUtils.filterByPriceRange(
                    sorted, BigDecimal.valueOf(60), BigDecimal.valueOf(100));
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns all when range covers everything")
        void allMatches() {
            List<Product> result = DSAUtils.filterByPriceRange(
                    sorted, BigDecimal.valueOf(1), BigDecimal.valueOf(999));
            assertThat(result).hasSameSizeAs(sorted);
        }
    }

    // ================================================================
    // 5. MIN HEAP — top-K cheapest
    // ================================================================
    @Nested
    @DisplayName("MinHeap — getTopKCheapest")
    class MinHeapTests {

        @Test
        @DisplayName("returns exactly K cheapest products")
        void topK() {
            List<Product> products = List.of(
                    product("A", 50), product("B", 10),
                    product("C", 30), product("D", 20), product("E", 40));
            List<Product> result = DSAUtils.getTopKCheapest(products, 3);
            assertThat(result).hasSize(3);
            assertThat(result).extracting(p -> p.getPrice().intValue())
                    .containsExactlyInAnyOrder(10, 20, 30);
        }

        @Test
        @DisplayName("K larger than list size returns all")
        void kLargerThanList() {
            List<Product> products = List.of(product("A", 5), product("B", 3));
            assertThat(DSAUtils.getTopKCheapest(products, 10)).hasSize(2);
        }

        @Test
        @DisplayName("K=1 returns cheapest product")
        void kEqualsOne() {
            List<Product> products = List.of(
                    product("A", 100), product("B", 5), product("C", 50));
            List<Product> result = DSAUtils.getTopKCheapest(products, 1);
            assertThat(result.get(0).getPrice().intValue()).isEqualTo(5);
        }
    }

    // ================================================================
    // 6. LRU CACHE
    // ================================================================
    @Nested
    @DisplayName("LRUCache — recently viewed")
    class LRUCacheTests {

        @Test
        @DisplayName("evicts eldest when over capacity")
        void evictsEldest() {
            DSAUtils.LRUCache<Integer, String> cache = new DSAUtils.LRUCache<>(3);
            cache.put(1, "a");
            cache.put(2, "b");
            cache.put(3, "c");
            cache.put(4, "d"); // evicts key=1
            assertThat(cache.get(1)).isNull();
            assertThat(cache.get(4)).isEqualTo("d");
        }

        @Test
        @DisplayName("get refreshes entry — keeps it from eviction")
        void getRefreshesEntry() {
            DSAUtils.LRUCache<Integer, String> cache = new DSAUtils.LRUCache<>(2);
            cache.put(1, "a");
            cache.put(2, "b");
            cache.get(1);        // refresh key=1
            cache.put(3, "c");   // evicts key=2 (least recently used)
            assertThat(cache.get(1)).isEqualTo("a");
            assertThat(cache.get(2)).isNull();
        }

        @Test
        @DisplayName("getAll returns entries most-recent first")
        void getAllOrdering() {
            DSAUtils.LRUCache<Integer, String> cache = new DSAUtils.LRUCache<>(5);
            cache.put(1, "first");
            cache.put(2, "second");
            cache.put(3, "third");
            List<String> all = cache.getAll();
            assertThat(all.get(0)).isEqualTo("third");
        }

        @Test
        @DisplayName("size reports correctly")
        void sizeReportsCorrectly() {
            DSAUtils.LRUCache<Integer, String> cache = new DSAUtils.LRUCache<>(10);
            cache.put(1, "a");
            cache.put(2, "b");
            assertThat(cache.size()).isEqualTo(2);
        }
    }

    // ================================================================
    // 7. GRAPH + BFS — related products
    // ================================================================
    @Nested
    @DisplayName("ProductGraph — BFS related products")
    class ProductGraphTests {

        @Test
        @DisplayName("BFS depth 1 returns direct neighbours only")
        void depth1() {
            DSAUtils.ProductGraph graph = new DSAUtils.ProductGraph();
            graph.addEdge(1L, 2L);
            graph.addEdge(1L, 3L);
            graph.addEdge(2L, 4L); // depth-2 from 1
            List<Long> related = graph.getRelatedProducts(1L, 1);
            assertThat(related).containsExactlyInAnyOrder(2L, 3L);
        }

        @Test
        @DisplayName("BFS depth 2 includes second-level neighbours")
        void depth2() {
            DSAUtils.ProductGraph graph = new DSAUtils.ProductGraph();
            graph.addEdge(1L, 2L);
            graph.addEdge(2L, 3L);
            List<Long> related = graph.getRelatedProducts(1L, 2);
            assertThat(related).contains(2L, 3L);
        }

        @Test
        @DisplayName("returns empty for isolated node")
        void isolatedNode() {
            DSAUtils.ProductGraph graph = new DSAUtils.ProductGraph();
            assertThat(graph.getRelatedProducts(99L, 3)).isEmpty();
        }

        @Test
        @DisplayName("no duplicates in results")
        void noDuplicates() {
            DSAUtils.ProductGraph graph = new DSAUtils.ProductGraph();
            graph.addEdge(1L, 2L);
            graph.addEdge(1L, 3L);
            graph.addEdge(2L, 3L);
            List<Long> related = graph.getRelatedProducts(1L, 2);
            assertThat(related).doesNotHaveDuplicates();
        }
    }

    // ================================================================
    // 8. STACK — reverseWithStack
    // ================================================================
    @Nested
    @DisplayName("Stack — reverseWithStack")
    class StackTests {

        @Test
        @DisplayName("reverses a list")
        void reverses() {
            List<Integer> result = DSAUtils.reverseWithStack(List.of(1, 2, 3, 4, 5));
            assertThat(result).containsExactly(5, 4, 3, 2, 1);
        }

        @Test
        @DisplayName("single element stays the same")
        void singleElement() {
            assertThat(DSAUtils.reverseWithStack(List.of(42))).containsExactly(42);
        }

        @Test
        @DisplayName("empty list returns empty")
        void emptyList() {
            assertThat(DSAUtils.reverseWithStack(List.of())).isEmpty();
        }
    }

    // ================================================================
    // 9. HASHMAP — buildSkuIndex
    // ================================================================
    @Nested
    @DisplayName("HashMap — buildSkuIndex")
    class SkuIndexTests {

        @Test
        @DisplayName("builds index keyed by SKU")
        void buildsIndex() {
            List<Product> products = List.of(
                    productWithSku("Widget", "SKU-001"),
                    productWithSku("Gadget", "SKU-002"));
            Map<String, Product> index = DSAUtils.buildSkuIndex(products);
            assertThat(index).containsKey("SKU-001");
            assertThat(index.get("SKU-002").getName()).isEqualTo("Gadget");
        }

        @Test
        @DisplayName("ignores products with null SKU")
        void ignoresNullSku() {
            Product noSku = new Product();
            noSku.setName("NoSku");
            Map<String, Product> index = DSAUtils.buildSkuIndex(List.of(noSku));
            assertThat(index).isEmpty();
        }
    }

    // ================================================================
    // 10. QUICK SELECT — findMedianPriceProduct
    // ================================================================
    @Nested
    @DisplayName("QuickSelect — findMedianPriceProduct")
    class QuickSelectTests {

        @Test
        @DisplayName("finds median for odd-length list")
        void oddList() {
            List<Product> products = List.of(
                    product("A", 10), product("B", 30), product("C", 20));
            Product median = DSAUtils.findMedianPriceProduct(new ArrayList<>(products));
            assertThat(median).isNotNull();
            assertThat(median.getPrice().intValue()).isEqualTo(20);
        }

        @Test
        @DisplayName("finds lower-median for even-length list")
        void evenList() {
            List<Product> products = List.of(
                    product("A", 10), product("B", 20),
                    product("C", 30), product("D", 40));
            Product median = DSAUtils.findMedianPriceProduct(new ArrayList<>(products));
            assertThat(median).isNotNull();
            // index = size/2 = 2 → 3rd cheapest (0-indexed)
            assertThat(median.getPrice().intValue()).isEqualTo(30);
        }

        @Test
        @DisplayName("returns null for null input")
        void nullInput() {
            assertThat(DSAUtils.findMedianPriceProduct(null)).isNull();
        }

        @Test
        @DisplayName("returns null for empty list")
        void emptyList() {
            assertThat(DSAUtils.findMedianPriceProduct(new ArrayList<>())).isNull();
        }

        @Test
        @DisplayName("returns only element for single-element list")
        void singleElement() {
            Product p = product("Solo", 99);
            assertThat(DSAUtils.findMedianPriceProduct(new ArrayList<>(List.of(p))))
                    .isEqualTo(p);
        }
    }
}