package com.shopwave.config;

import com.shopwave.model.Product;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * DSAUtils — in-memory data-structure utilities for ShopWave.
 *
 * ⚠️  THREAD-SAFETY / MULTI-INSTANCE WARNING
 * ─────────────────────────────────────────────────────────────────────────────
 * Every structure in this class (Trie, LRUCache, skuIndex, ProductGraph) lives
 * entirely in JVM heap memory. This has two critical consequences:
 *
 *  1. SINGLE-INSTANCE ONLY — If you run more than one backend instance
 *     (horizontal scaling, Kubernetes replicas, blue-green deployments),
 *     each replica holds its OWN copy. A product inserted on replica-A is
 *     invisible to replica-B's Trie / skuIndex until that replica restarts.
 *     → Production fix: replace with Redis (RedisSearch for Trie,
 *       Redis with TTL for LRU, DB unique index for SKU lookup).
 *
 *  2. NOT THREAD-SAFE BY DEFAULT — Spring's @Component creates one singleton
 *     bean shared across ALL concurrent HTTP threads. Unsynchronised writes
 *     to the HashMap-backed Trie and LinkedHashMap-backed LRUCache will cause
 *     data races, silent data loss, or ConcurrentModificationException.
 *     → Fix applied below: synchronized on all public mutating methods.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Component
public class DSAUtils {

    // ── 1. TRIE — Product Search Autocomplete ─────────────────────────────────
    // ⚠️ HashMap children are NOT thread-safe. Fixed with synchronized methods.
    public static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        boolean isEnd = false;
        String word;
    }

    public static class Trie {
        private final TrieNode root = new TrieNode();

        public synchronized void insert(String word) {
            if (word == null || word.isEmpty()) return;
            TrieNode node = root;
            for (char ch : word.toLowerCase().toCharArray()) {
                node.children.putIfAbsent(ch, new TrieNode());
                node = node.children.get(ch);
            }
            node.isEnd = true;
            node.word = word;
        }

        public synchronized List<String> getSuggestions(String prefix, int limit) {
            List<String> results = new ArrayList<>();
            if (prefix == null || prefix.isEmpty()) return results;
            TrieNode node = root;
            for (char ch : prefix.toLowerCase().toCharArray()) {
                if (!node.children.containsKey(ch)) return results;
                node = node.children.get(ch);
            }
            dfs(node, results, limit);
            return results;
        }

        private void dfs(TrieNode node, List<String> results, int limit) {
            if (results.size() >= limit) return;
            if (node.isEnd) results.add(node.word);
            for (TrieNode child : node.children.values()) dfs(child, results, limit);
        }
    }

    // ── 2. MERGE SORT — Sort by Price ─────────────────────────────────────────
    public static List<Product> mergeSortByPrice(List<Product> products, boolean ascending) {
        if (products.size() <= 1) return products;
        int mid = products.size() / 2;
        List<Product> left  = mergeSortByPrice(new ArrayList<>(products.subList(0, mid)), ascending);
        List<Product> right = mergeSortByPrice(new ArrayList<>(products.subList(mid, products.size())), ascending);
        return mergeByPrice(left, right, ascending);
    }

    private static List<Product> mergeByPrice(List<Product> left, List<Product> right, boolean ascending) {
        List<Product> result = new ArrayList<>();
        int i = 0, j = 0;
        while (i < left.size() && j < right.size()) {
            int cmp = left.get(i).getPrice().compareTo(right.get(j).getPrice());
            if (ascending ? cmp <= 0 : cmp >= 0) result.add(left.get(i++));
            else result.add(right.get(j++));
        }
        while (i < left.size())  result.add(left.get(i++));
        while (j < right.size()) result.add(right.get(j++));
        return result;
    }

    // ── 3. MERGE SORT — Sort by Rating ───────────────────────────────────────
    public static List<Product> mergeSortByRating(List<Product> products) {
        if (products.size() <= 1) return products;
        int mid = products.size() / 2;
        List<Product> left  = mergeSortByRating(new ArrayList<>(products.subList(0, mid)));
        List<Product> right = mergeSortByRating(new ArrayList<>(products.subList(mid, products.size())));
        return mergeByRating(left, right);
    }

    private static List<Product> mergeByRating(List<Product> left, List<Product> right) {
        List<Product> result = new ArrayList<>();
        int i = 0, j = 0;
        while (i < left.size() && j < right.size()) {
            double rL = left.get(i).getAverageRating()  != null ? left.get(i).getAverageRating()  : 0.0;
            double rR = right.get(j).getAverageRating() != null ? right.get(j).getAverageRating() : 0.0;
            if (rL >= rR) result.add(left.get(i++));
            else          result.add(right.get(j++));
        }
        while (i < left.size())  result.add(left.get(i++));
        while (j < right.size()) result.add(right.get(j++));
        return result;
    }

    // ── 4. BINARY SEARCH — Filter by Price Range ─────────────────────────────
    public static List<Product> filterByPriceRange(List<Product> sortedProducts, BigDecimal min, BigDecimal max) {
        int left  = binarySearchLeft(sortedProducts, min);
        int right = binarySearchRight(sortedProducts, max);
        return sortedProducts.subList(left, right);
    }

    private static int binarySearchLeft(List<Product> p, BigDecimal target) {
        int lo = 0, hi = p.size();
        while (lo < hi) { int mid = (lo + hi) >>> 1; if (p.get(mid).getPrice().compareTo(target) < 0) lo = mid+1; else hi = mid; }
        return lo;
    }

    private static int binarySearchRight(List<Product> p, BigDecimal target) {
        int lo = 0, hi = p.size();
        while (lo < hi) { int mid = (lo + hi) >>> 1; if (p.get(mid).getPrice().compareTo(target) <= 0) lo = mid+1; else hi = mid; }
        return lo;
    }

    // ── 5. MIN HEAP — Top-K Cheapest ─────────────────────────────────────────
    public static List<Product> getTopKCheapest(List<Product> products, int k) {
        PriorityQueue<Product> minHeap = new PriorityQueue<>(Comparator.comparing(Product::getPrice));
        minHeap.addAll(products);
        List<Product> result = new ArrayList<>();
        for (int i = 0; i < Math.min(k, products.size()); i++) result.add(minHeap.poll());
        return result;
    }

    // ── 6. LRU CACHE — Recently Viewed ───────────────────────────────────────
    // ⚠️ LinkedHashMap is NOT thread-safe. Fixed: all methods synchronized.
    // Production: replace with Redis (spring-boot-starter-data-redis + @Cacheable).
    public static class LRUCache<K, V> {
        private final int capacity;
        private final LinkedHashMap<K, V> cache;

        public LRUCache(int capacity) {
            this.capacity = capacity;
            this.cache = new LinkedHashMap<>(capacity, 0.75f, true) {
                @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) { return size() > capacity; }
            };
        }

        public synchronized V    get(K key)            { return cache.getOrDefault(key, null); }
        public synchronized void put(K key, V value)   { cache.put(key, value); }
        public synchronized int  size()                { return cache.size(); }
        public synchronized List<V> getAll() {
            List<V> r = new ArrayList<>(cache.values());
            Collections.reverse(r);
            return r;
        }
    }

    // ── 7. GRAPH BFS — Related Products ──────────────────────────────────────
    // ⚠️ Fixed: ConcurrentHashMap + synchronizedList for thread-safety.
    public static class ProductGraph {
        private final Map<Long, List<Long>> adjacencyList = new ConcurrentHashMap<>();

        public void addEdge(Long productId, Long relatedId) {
            adjacencyList.computeIfAbsent(productId, k -> Collections.synchronizedList(new ArrayList<>())).add(relatedId);
            adjacencyList.computeIfAbsent(relatedId,  k -> Collections.synchronizedList(new ArrayList<>())).add(productId);
        }

        public List<Long> getRelatedProducts(Long productId, int maxDepth) {
            List<Long> result = new ArrayList<>();
            if (!adjacencyList.containsKey(productId)) return result;
            Set<Long> visited = new HashSet<>();
            Queue<Long> queue = new LinkedList<>();
            Map<Long, Integer> depth = new HashMap<>();
            queue.add(productId); visited.add(productId); depth.put(productId, 0);
            while (!queue.isEmpty()) {
                Long cur = queue.poll(); int d = depth.get(cur);
                if (d > 0) result.add(cur);
                if (d < maxDepth)
                    for (Long nb : adjacencyList.getOrDefault(cur, new ArrayList<>()))
                        if (!visited.contains(nb)) { visited.add(nb); queue.add(nb); depth.put(nb, d+1); }
            }
            return result;
        }
    }

    // ── 8. STACK — Reverse Order History ─────────────────────────────────────
    public static <T> List<T> reverseWithStack(List<T> items) {
        Stack<T> stack = new Stack<>();
        for (T item : items) stack.push(item);
        List<T> reversed = new ArrayList<>();
        while (!stack.isEmpty()) reversed.add(stack.pop());
        return reversed;
    }

    // ── 9. HASHMAP — O(1) SKU Lookup ─────────────────────────────────────────
    // ⚠️ Fixed: ConcurrentHashMap instead of HashMap for safe concurrent reads.
    public static Map<String, Product> buildSkuIndex(List<Product> products) {
        Map<String, Product> skuMap = new ConcurrentHashMap<>();
        for (Product p : products) if (p.getSku() != null) skuMap.put(p.getSku(), p);
        return skuMap;
    }

    // ── 10. QUICK SELECT — Median Price Product ───────────────────────────────
    public static Product findMedianPriceProduct(List<Product> products) {
        if (products == null || products.isEmpty()) return null;
        List<Product> copy = new ArrayList<>(products);
        return quickSelect(copy, 0, copy.size()-1, copy.size()/2);
    }

    private static Product quickSelect(List<Product> p, int left, int right, int k) {
        if (left == right) return p.get(left);
        int pivot = partition(p, left, right);
        if (k == pivot) return p.get(k);
        return k < pivot ? quickSelect(p, left, pivot-1, k) : quickSelect(p, pivot+1, right, k);
    }

    private static int partition(List<Product> p, int left, int right) {
        BigDecimal pivot = p.get(right).getPrice(); int i = left-1;
        for (int j = left; j < right; j++) if (p.get(j).getPrice().compareTo(pivot) < 0) { i++; Collections.swap(p,i,j); }
        Collections.swap(p, i+1, right); return i+1;
    }
}