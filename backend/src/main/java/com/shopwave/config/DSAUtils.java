package com.shopwave.config;

import com.shopwave.model.Product;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * DSAUtils — 10 data structures / algorithms with production business use.
 *
 * Thread-safety fixes (vs original):
 *  - Trie: protected by ReentrantReadWriteLock
 *  - LRUCache: synchronized wrapper around LinkedHashMap
 *  - skuIndex in ProductService: replaced HashMap → ConcurrentHashMap
 *
 * Scale notes (document in interviews):
 *  - Trie / LRU are per-JVM. Replace with Redis for multi-node deployment.
 *  - Sorts are in-memory. Replace with DB ORDER BY / Elasticsearch for scale.
 */
@Component
public class DSAUtils {

    // ════════════════════════════════════════════════════════════
    // 1. TRIE — Product Search Autocomplete   O(L) insert, O(L+k) search
    // ════════════════════════════════════════════════════════════
    public static class TrieNode {
        final Map<Character, TrieNode> children = new HashMap<>();
        boolean isEnd;
        String word = "";
    }

    /**
     * Thread-safe Trie using ReadWriteLock.
     * Multiple concurrent reads allowed; writes are exclusive.
     */
    public static class Trie {
        private final TrieNode root = new TrieNode();
        private final ReadWriteLock lock = new ReentrantReadWriteLock();

        public void insert(String word) {
            if (word == null || word.isBlank()) return;
            lock.writeLock().lock();
            try {
                TrieNode node = root;
                for (char ch : word.toLowerCase().toCharArray()) {
                    node.children.putIfAbsent(ch, new TrieNode());
                    node = node.children.get(ch);
                }
                node.isEnd = true;
                node.word = word;
            } finally {
                lock.writeLock().unlock();
            }
        }

        public List<String> getSuggestions(String prefix, int limit) {
            if (prefix == null || prefix.isBlank()) return Collections.emptyList();
            lock.readLock().lock();
            try {
                TrieNode node = root;
                for (char ch : prefix.toLowerCase().toCharArray()) {
                    if (!node.children.containsKey(ch)) return Collections.emptyList();
                    node = node.children.get(ch);
                }
                List<String> results = new ArrayList<>();
                dfs(node, results, limit);
                return results;
            } finally {
                lock.readLock().unlock();
            }
        }

        private void dfs(TrieNode node, List<String> results, int limit) {
            if (results.size() >= limit) return;
            if (node.isEnd) results.add(node.word);
            for (TrieNode child : node.children.values()) {
                if (results.size() >= limit) break;
                dfs(child, results, limit);
            }
        }
    }

    // ════════════════════════════════════════════════════════════
    // 2. MERGE SORT — Sort Products by Price   O(n log n) stable
    // ════════════════════════════════════════════════════════════
    public static List<Product> mergeSortByPrice(List<Product> products, boolean ascending) {
        if (products.size() <= 1) return products;
        int mid = products.size() / 2;
        List<Product> left  = mergeSortByPrice(new ArrayList<>(products.subList(0, mid)), ascending);
        List<Product> right = mergeSortByPrice(new ArrayList<>(products.subList(mid, products.size())), ascending);
        return mergeByPrice(left, right, ascending);
    }

    private static List<Product> mergeByPrice(List<Product> left, List<Product> right, boolean ascending) {
        List<Product> result = new ArrayList<>(left.size() + right.size());
        int i = 0, j = 0;
        while (i < left.size() && j < right.size()) {
            int cmp = left.get(i).getPrice().compareTo(right.get(j).getPrice());
            result.add((ascending ? cmp <= 0 : cmp >= 0) ? left.get(i++) : right.get(j++));
        }
        while (i < left.size())  result.add(left.get(i++));
        while (j < right.size()) result.add(right.get(j++));
        return result;
    }

    // ════════════════════════════════════════════════════════════
    // 3. MERGE SORT — Sort Products by Rating   O(n log n) stable
    // ════════════════════════════════════════════════════════════
    public static List<Product> mergeSortByRating(List<Product> products) {
        if (products.size() <= 1) return products;
        int mid = products.size() / 2;
        List<Product> left  = mergeSortByRating(new ArrayList<>(products.subList(0, mid)));
        List<Product> right = mergeSortByRating(new ArrayList<>(products.subList(mid, products.size())));
        return mergeByRating(left, right);
    }

    private static List<Product> mergeByRating(List<Product> left, List<Product> right) {
        List<Product> result = new ArrayList<>(left.size() + right.size());
        int i = 0, j = 0;
        while (i < left.size() && j < right.size()) {
            double rL = left.get(i).getAverageRating()  != null ? left.get(i).getAverageRating()  : 0;
            double rR = right.get(j).getAverageRating() != null ? right.get(j).getAverageRating() : 0;
            result.add(rL >= rR ? left.get(i++) : right.get(j++));
        }
        while (i < left.size())  result.add(left.get(i++));
        while (j < right.size()) result.add(right.get(j++));
        return result;
    }

    // ════════════════════════════════════════════════════════════
    // 4. BINARY SEARCH — Filter Products by Price Range
    //    Precondition: list must be sorted ascending by price
    //    Time: O(log n) after O(n log n) sort → overall O(n log n)
    // ════════════════════════════════════════════════════════════
    public static List<Product> filterByPriceRange(List<Product> sortedProducts,
                                                    BigDecimal min, BigDecimal max) {
        int left  = lowerBound(sortedProducts, min);
        int right = upperBound(sortedProducts, max);
        return sortedProducts.subList(left, right);
    }

    private static int lowerBound(List<Product> p, BigDecimal target) {
        int lo = 0, hi = p.size();
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (p.get(mid).getPrice().compareTo(target) < 0) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    private static int upperBound(List<Product> p, BigDecimal target) {
        int lo = 0, hi = p.size();
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (p.get(mid).getPrice().compareTo(target) <= 0) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    // ════════════════════════════════════════════════════════════
    // 5. MIN HEAP — Top-K Cheapest Products   O(n + K log n)
    //    Interview note: for small K use max-heap of size K → O(n log K)
    // ════════════════════════════════════════════════════════════
    public static List<Product> getTopKCheapest(List<Product> products, int k) {
        PriorityQueue<Product> minHeap =
            new PriorityQueue<>(Comparator.comparing(Product::getPrice));
        minHeap.addAll(products);
        List<Product> result = new ArrayList<>(Math.min(k, products.size()));
        for (int i = 0; i < Math.min(k, products.size()); i++) result.add(minHeap.poll());
        return result;
    }

    // ════════════════════════════════════════════════════════════
    // 6. LRU CACHE — Recently Viewed Products   O(1) get/put
    //    FIXED: synchronized wrapper for thread safety
    // ════════════════════════════════════════════════════════════
    public static class LRUCache<K, V> {
        private final int capacity;
        private final Map<K, V> cache;

        public LRUCache(int capacity) {
            this.capacity = capacity;
            // Synchronized wrapper makes get/put thread-safe
            this.cache = Collections.synchronizedMap(
                new LinkedHashMap<>(capacity, 0.75f, true) {
                    @Override
                    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                        return size() > capacity;
                    }
                }
            );
        }

        public V get(K key) { return cache.getOrDefault(key, null); }

        public void put(K key, V value) { cache.put(key, value); }

        public List<V> getAll() {
            synchronized (cache) {
                List<V> result = new ArrayList<>(cache.values());
                Collections.reverse(result);
                return result;
            }
        }

        public int size() { return cache.size(); }
    }

    // ════════════════════════════════════════════════════════════
    // 7. GRAPH + BFS — Related Product Recommendations   O(V+E)
    //    BFS chosen: explores closest relationships first (depth 1
    //    neighbors are more related than depth 2).
    // ════════════════════════════════════════════════════════════
    public static class ProductGraph {
        private final Map<Long, List<Long>> adj = new ConcurrentHashMap<>();

        public void addEdge(Long a, Long b) {
            adj.computeIfAbsent(a, k -> Collections.synchronizedList(new ArrayList<>())).add(b);
            adj.computeIfAbsent(b, k -> Collections.synchronizedList(new ArrayList<>())).add(a);
        }

        public List<Long> getRelatedProducts(Long productId, int maxDepth) {
            List<Long> result = new ArrayList<>();
            if (!adj.containsKey(productId)) return result;
            Set<Long> visited = new HashSet<>();
            Queue<Long> queue = new ArrayDeque<>();
            Map<Long, Integer> depth = new HashMap<>();
            queue.add(productId);
            visited.add(productId);
            depth.put(productId, 0);
            while (!queue.isEmpty()) {
                Long current = queue.poll();
                int d = depth.get(current);
                if (d > 0) result.add(current);
                if (d < maxDepth) {
                    for (Long neighbor : adj.getOrDefault(current, Collections.emptyList())) {
                        if (visited.add(neighbor)) {
                            queue.add(neighbor);
                            depth.put(neighbor, d + 1);
                        }
                    }
                }
            }
            return result;
        }
    }

    // ════════════════════════════════════════════════════════════
    // 8. STACK — Order History Navigation (browser back-stack model)
    //    Push each status update; pop to navigate backwards.
    //    O(n) time, O(n) space.
    // ════════════════════════════════════════════════════════════
    public static <T> List<T> reverseWithStack(List<T> items) {
        Deque<T> stack = new ArrayDeque<>(items);
        List<T> reversed = new ArrayList<>(items.size());
        while (!stack.isEmpty()) reversed.add(stack.pop());
        return reversed;
    }

    // ════════════════════════════════════════════════════════════
    // 9. HASH MAP (ConcurrentHashMap) — O(1) SKU Lookup
    //    FIXED: was plain HashMap in ProductService singleton (data race).
    //    buildSkuIndex() used at startup; incremental updates via
    //    ConcurrentHashMap in ProductService.
    // ════════════════════════════════════════════════════════════
    public static Map<String, Product> buildSkuIndex(List<Product> products) {
        Map<String, Product> index = new ConcurrentHashMap<>();
        for (Product p : products) {
            if (p.getSku() != null) index.put(p.getSku(), p);
        }
        return index;
    }

    // ════════════════════════════════════════════════════════════
    // 10. QUICK SELECT — Find Median Price Product   O(n) avg, O(n²) worst
    //     Works on a defensive copy to avoid mutating caller's list.
    //     For production, add shuffle before partition to avoid worst-case.
    // ════════════════════════════════════════════════════════════
    public static Product findMedianPriceProduct(List<Product> products) {
        if (products == null || products.isEmpty()) return null;
        List<Product> copy = new ArrayList<>(products);
        return quickSelect(copy, 0, copy.size() - 1, copy.size() / 2);
    }

    private static Product quickSelect(List<Product> p, int lo, int hi, int k) {
        if (lo == hi) return p.get(lo);
        int pivot = partition(p, lo, hi);
        if (k == pivot) return p.get(k);
        return k < pivot ? quickSelect(p, lo, pivot - 1, k) : quickSelect(p, pivot + 1, hi, k);
    }

    private static int partition(List<Product> p, int lo, int hi) {
        BigDecimal pivot = p.get(hi).getPrice();
        int i = lo - 1;
        for (int j = lo; j < hi; j++) {
            if (p.get(j).getPrice().compareTo(pivot) <= 0) {
                Collections.swap(p, ++i, j);
            }
        }
        Collections.swap(p, i + 1, hi);
        return i + 1;
    }
}