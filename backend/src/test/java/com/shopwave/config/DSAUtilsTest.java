package com.shopwave.config;

import com.shopwave.model.Product;
import org.junit.jupiter.api.*;
import java.math.BigDecimal;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class DSAUtilsTest {

    // ── Trie ──────────────────────────────────────────────────────────────────
    @Nested @DisplayName("Trie – autocomplete")
    class TrieTests {
        private DSAUtils.Trie trie;

        @BeforeEach void setUp() {
            trie = new DSAUtils.Trie();
            trie.insert("iphone"); trie.insert("ipad");
            trie.insert("samsung"); trie.insert("sony");
        }

        @Test void suggestionsForValidPrefix() {
            assertThat(trie.getSuggestions("ip", 5)).containsExactlyInAnyOrder("iphone","ipad");
        }
        @Test void noSuggestionsForUnknownPrefix() {
            assertThat(trie.getSuggestions("xyz", 5)).isEmpty();
        }
        @Test void respectsLimit() {
            trie.insert("iphonecase");
            assertThat(trie.getSuggestions("i", 2)).hasSize(2);
        }
        @Test void caseInsensitive() {
            assertThat(trie.getSuggestions("IPHONE", 5)).contains("iphone");
        }
        @Test void handlesNullPrefix() {
            assertThat(trie.getSuggestions(null, 5)).isEmpty();
            assertThat(trie.getSuggestions("",   5)).isEmpty();
        }
    }

    // ── Merge Sort ────────────────────────────────────────────────────────────
    @Nested @DisplayName("MergeSort – by price")
    class MergeSortTests {
        private List<Product> products;

        @BeforeEach void setUp() {
            products = new ArrayList<>(List.of(
                product(3L, "C", new BigDecimal("300")),
                product(1L, "A", new BigDecimal("100")),
                product(2L, "B", new BigDecimal("200"))
            ));
        }

        @Test void sortsAscending() {
            assertThat(DSAUtils.mergeSortByPrice(products, true))
                .extracting(p -> p.getPrice().intValue()).containsExactly(100,200,300);
        }
        @Test void sortsDescending() {
            assertThat(DSAUtils.mergeSortByPrice(products, false))
                .extracting(p -> p.getPrice().intValue()).containsExactly(300,200,100);
        }
        @Test void singleElement() {
            assertThat(DSAUtils.mergeSortByPrice(List.of(product(1L,"A",new BigDecimal("50"))),true)).hasSize(1);
        }
    }

    // ── Binary Search ─────────────────────────────────────────────────────────
    @Nested @DisplayName("BinarySearch – price range")
    class BinarySearchTests {
        @Test void filtersCorrectly() {
            List<Product> sorted = List.of(
                product(1L,"A",new BigDecimal("100")), product(2L,"B",new BigDecimal("200")),
                product(3L,"C",new BigDecimal("300")), product(4L,"D",new BigDecimal("400"))
            );
            assertThat(DSAUtils.filterByPriceRange(sorted, new BigDecimal("150"), new BigDecimal("350")))
                .extracting(p -> p.getPrice().intValue()).containsExactly(200,300);
        }
        @Test void emptyRange() {
            assertThat(DSAUtils.filterByPriceRange(
                List.of(product(1L,"A",new BigDecimal("500"))),
                new BigDecimal("100"), new BigDecimal("200"))).isEmpty();
        }
    }

    // ── Min Heap ──────────────────────────────────────────────────────────────
    @Nested @DisplayName("MinHeap – top-K cheapest")
    class MinHeapTests {
        @Test void topKCheapest() {
            List<Product> products = List.of(
                product(1L,"A",new BigDecimal("500")), product(2L,"B",new BigDecimal("100")),
                product(3L,"C",new BigDecimal("300")), product(4L,"D",new BigDecimal("200"))
            );
            assertThat(DSAUtils.getTopKCheapest(products, 2))
                .extracting(p -> p.getPrice().intValue()).containsExactlyInAnyOrder(100,200);
        }
        @Test void kLargerThanList() {
            assertThat(DSAUtils.getTopKCheapest(List.of(product(1L,"A",new BigDecimal("10"))),99)).hasSize(1);
        }
    }

    // ── LRU Cache ─────────────────────────────────────────────────────────────
    @Nested @DisplayName("LRUCache – eviction")
    class LRUCacheTests {
        @Test void evictsEldest() {
            DSAUtils.LRUCache<Long,String> c = new DSAUtils.LRUCache<>(2);
            c.put(1L,"A"); c.put(2L,"B"); c.put(3L,"C");
            assertThat(c.get(1L)).isNull();
            assertThat(c.get(3L)).isEqualTo("C");
        }
        @Test void getUpdatesRecency() {
            DSAUtils.LRUCache<Long,String> c = new DSAUtils.LRUCache<>(2);
            c.put(1L,"A"); c.put(2L,"B"); c.get(1L); c.put(3L,"C");
            assertThat(c.get(2L)).isNull();
            assertThat(c.get(1L)).isEqualTo("A");
        }
    }

    // ── Stack ─────────────────────────────────────────────────────────────────
    @Test void stackReversesOrder() {
        assertThat(DSAUtils.reverseWithStack(List.of("PENDING","CONFIRMED","SHIPPED")))
            .containsExactly("SHIPPED","CONFIRMED","PENDING");
    }

    // ── QuickSelect ───────────────────────────────────────────────────────────
    @Test void quickSelectReturnsNullForEmpty() {
        assertThat(DSAUtils.findMedianPriceProduct(List.of())).isNull();
    }
    @Test void quickSelectFindsMedian() {
        assertThat(DSAUtils.findMedianPriceProduct(List.of(
            product(1L,"A",new BigDecimal("100")),
            product(2L,"B",new BigDecimal("300")),
            product(3L,"C",new BigDecimal("200"))
        ))).isNotNull();
    }

    private Product product(Long id, String name, BigDecimal price) {
        Product p = new Product(); p.setId(id); p.setName(name); p.setPrice(price); return p;
    }
}