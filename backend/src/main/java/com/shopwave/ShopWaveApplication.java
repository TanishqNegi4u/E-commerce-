package com.shopwave;

import com.shopwave.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
@RequiredArgsConstructor
@Slf4j
public class ShopWaveApplication implements CommandLineRunner {

    private final ProductService productService;

    public static void main(String[] args) {
        SpringApplication.run(ShopWaveApplication.class, args);
        log.info("🚀 ShopWave started successfully!");
    }

    @Override
    public void run(String... args) {
        productService.loadAllProductsToTrie();
        log.info("✅ Search Trie initialized");
    }
}