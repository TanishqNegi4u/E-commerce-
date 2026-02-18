package com.shopwave.config;

import com.shopwave.model.Product;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

@Component
public class DSAUtils {

    // ============================================================
    // 1. TRIE — Product Search Autocomplete
    // ============================================================
    public static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        boolean isEnd = false;
        String word = "";
    }

    public static class Trie {
        private final TrieNode root = new TrieNode();

        public void insert(String word) {
            if (word == null || word.isEmpty()) return;
            TrieNode node = root;
            for (char ch : word.toLowerCase().toCharArray()) {
                node.children.putIfAbsent(ch, new TrieNode());
                node = node.children.get(ch);
            }
            node.isEnd = true;
            node.word = word;
        }

        public List<String> getSuggestions(String prefix, int limit) {
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
            for (TrieNode child : node.children.values()) {
                dfs(child, results, limit);
            }
        }
    }

    // ============================================================
    // 2. MERGE SORT — Sort Products by Price
    // ============================================================
    public static List<Product> mergeSortByPrice(
            List<Product> products, boolean ascending) {
        if (products.size() <= 1) return products;
        int mid = products.size() / 2;
        List<Product> left = mergeSortByPrice(
            new ArrayList<>(products.subList(0, mid)), ascending);
        List<Product> right = mergeSortByPrice(
            new ArrayList<>(products.subList(mid, products.size())), ascending);
        return mergeByPrice(left, right, ascending);
    }

    private static List<Product> mergeByPrice(
            List<Product> left, List<Product> right, boolean ascending) {
        List<Product> result = new ArrayList<>();
        int i = 0, j = 0;
        while (i < left.size() && j < right.size()) {
            int cmp = left.get(i).getPrice()
                .compareTo(right.get(j).getPrice());
            if (ascending ? cmp <= 0 : cmp >= 0) result.add(left.get(i++));
            else result.add(right.get(j++));
        }
        while (i < left.size()) result.add(left.get(i++));
        while (j < right.size()) result.add(right.get(j++));
        return result;
    }

    // ============================================================
    // 3. MERGE SORT — Sort Products by Rating
    // ============================================================
    public static List<Product> mergeSortByRating(List<Product> products) {
        if (products.size() <= 1) return products;
        int mid = products.size() / 2;
        List<Product> left = mergeSortByRating(
            new ArrayList<>(products.subList(0, mid)));
        List<Product> right = mergeSortByRating(
            new ArrayList<>(products.subList(mid, products.size())));
        return mergeByRating(left, right);
    }

    private static List<Product> mergeByRating(
            List<Product> left, List<Product> right) {
        List<Product> result = new ArrayList<>();
        int i = 0, j = 0;
        while (i < left.size() && j < right.size()) {
            double ratingL = left.get(i).getAverageRating() != null
                ? left.get(i).getAverageRating() : 0.0;
            double ratingR = right.get(j).getAverageRating() != null
                ? right.get(j).getAverageRating() : 0.0;
            if (ratingL >= ratingR) result.add(left.get(i++));
            else result.add(right.get(j++));
        }
        while (i < left.size()) result.add(left.get(i++));
        while (j < right.size()) result.add(right.get(j++));
        return result;
    }

    // ============================================================
    // 4. BINARY SEARCH — Filter Products by Price Range
    // ============================================================
    public static List<Product> filterByPriceRange(
            List<Product> sortedProducts, BigDecimal min, BigDecimal max) {
        int left = binarySearchLeft(sortedProducts, min);
        int right = binarySearchRight(sortedProducts, max);
        return sortedProducts.subList(left, right);
    }

    private static int binarySearchLeft(
            List<Product> products, BigDecimal target) {
        int lo = 0, hi = products.size();
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (products.get(mid).getPrice().compareTo(target) < 0) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    private static int binarySearchRight(
            List<Product> products, BigDecimal target) {
        int lo = 0, hi = products.size();
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (products.get(mid).getPrice().compareTo(target) <= 0) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    // ============================================================
    // 5. MIN HEAP — Top-K Cheapest Products
    // ============================================================
    public static List<Product> getTopKCheapest(
            List<Product> products, int k) {
        PriorityQueue<Product> minHeap = new PriorityQueue<>(
            Comparator.comparing(Product::getPrice));
        minHeap.addAll(products);
        List<Product> result = new ArrayList<>();
        int count = Math.min(k, products.size());
        for (int i = 0; i < count; i++) {
            result.add(minHeap.poll());
        }
        return result;
    }

    // ============================================================
    // 6. LRU CACHE — Recently Viewed Products
    // ============================================================
    public static class LRUCache<K, V> {
        private final int capacity;
        private final LinkedHashMap<K, V> cache;

        public LRUCache(int capacity) {
            this.capacity = capacity;
            this.cache = new LinkedHashMap<>(capacity, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                    return size() > capacity;
                }
            };
        }

        public V get(K key) {
            return cache.getOrDefault(key, null);
        }

        public void put(K key, V value) {
            cache.put(key, value);
        }

        public List<V> getAll() {
            List<V> result = new ArrayList<>(cache.values());
            Collections.reverse(result);
            return result;
        }

        public int size() {
            return cache.size();
        }
    }

    // ============================================================
    // 7. GRAPH + BFS — Related Product Recommendations
    // ============================================================
    public static class ProductGraph {
        private final Map<Long, List<Long>> adjacencyList = new HashMap<>();

        public void addEdge(Long productId, Long relatedId) {
            adjacencyList.computeIfAbsent(productId, k -> new ArrayList<>()).add(relatedId);
            adjacencyList.computeIfAbsent(relatedId, k -> new ArrayList<>()).add(productId);
        }

        public List<Long> getRelatedProducts(Long productId, int maxDepth) {
            List<Long> result = new ArrayList<>();
            if (!adjacencyList.containsKey(productId)) return result;
            Set<Long> visited = new HashSet<>();
            Queue<Long> queue = new LinkedList<>();
            Map<Long, Integer> depth = new HashMap<>();
            queue.add(productId);
            visited.add(productId);
            depth.put(productId, 0);
            while (!queue.isEmpty()) {
                Long current = queue.poll();
                int currentDepth = depth.get(current);
                if (currentDepth > 0) result.add(current);
                if (currentDepth < maxDepth) {
                    for (Long neighbor : adjacencyList
                            .getOrDefault(current, new ArrayList<>())) {
                        if (!visited.contains(neighbor)) {
                            visited.add(neighbor);
                            queue.add(neighbor);
                            depth.put(neighbor, currentDepth + 1);
                        }
                    }
                }
            }
            return result;
        }
    }

    // ============================================================
    // 8. STACK — Order Status History (reverse chronological)
    // ============================================================
    public static <T> List<T> reverseWithStack(List<T> items) {
        Stack<T> stack = new Stack<>();
        for (T item : items) stack.push(item);
        List<T> reversed = new ArrayList<>();
        while (!stack.isEmpty()) reversed.add(stack.pop());
        return reversed;
    }

    // ============================================================
    // 9. HASHMAP — O(1) Product Lookup by SKU
    // ============================================================
    public static Map<String, Product> buildSkuIndex(List<Product> products) {
        Map<String, Product> skuMap = new HashMap<>();
        for (Product p : products) {
            if (p.getSku() != null) skuMap.put(p.getSku(), p);
        }
        return skuMap;
    }

    // ============================================================
    // 10. QUICK SELECT — Find Median Price Product
    // ============================================================
    public static Product findMedianPriceProduct(List<Product> products) {
        if (products == null || products.isEmpty()) return null;
        List<Product> copy = new ArrayList<>(products);
        int medianIdx = copy.size() / 2;
        return quickSelect(copy, 0, copy.size() - 1, medianIdx);
    }

    private static Product quickSelect(
            List<Product> products, int left, int right, int k) {
        if (left == right) return products.get(left);
        int pivotIdx = partition(products, left, right);
        if (k == pivotIdx) return products.get(k);
        else if (k < pivotIdx) return quickSelect(products, left, pivotIdx - 1, k);
        else return quickSelect(products, pivotIdx + 1, right, k);
    }

    private static int partition(
            List<Product> products, int left, int right) {
        BigDecimal pivot = products.get(right).getPrice();
        int i = left - 1;
        for (int j = left; j < right; j++) {
            if (products.get(j).getPrice().compareTo(pivot) <= 0) {
                i++;
                Collections.swap(products, i, j);
            }
        }
        Collections.swap(products, i + 1, right);
        return i + 1;
    }
}