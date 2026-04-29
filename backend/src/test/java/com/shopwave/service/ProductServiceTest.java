package com.shopwave.service;

import com.shopwave.config.DSAUtils;
import com.shopwave.dto.ProductRequest;
import com.shopwave.exception.ResourceNotFoundException;
import com.shopwave.model.*;
import com.shopwave.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import java.math.BigDecimal;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock ProductRepository  productRepository;
    @Mock CategoryRepository categoryRepository;
    @Mock UserRepository     userRepository;
    @Mock DSAUtils           dsaUtils;

    @InjectMocks ProductService productService;

    private Category category;
    private User seller;
    private Product product;

    @BeforeEach void setUp() {
        category = new Category(); category.setId(1L); category.setName("Electronics");
        seller   = new User();     seller.setId(1L);   seller.setEmail("seller@shopwave.com");
        product  = new Product();  product.setId(1L);  product.setName("iPhone 15 Pro");
        product.setPrice(new BigDecimal("134900")); product.setStock(10);
        product.setCategory(category); product.setSeller(seller); product.setIsActive(true);
    }

    @Nested @DisplayName("getProductById")
    class GetByIdTests {
        @Test void returnsProductWhenFound() {
            when(productRepository.findById(1L)).thenReturn(Optional.of(product));
            assertThat(productService.getProductById(1L).getName()).isEqualTo("iPhone 15 Pro");
        }
        @Test void throwsWhenNotFound() {
            when(productRepository.findById(99L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> productService.getProductById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("createProduct")
    class CreateTests {
        @Test void createsSuccessfully() {
            ProductRequest req = ProductRequest.builder()
                .name("Galaxy S24").price(new BigDecimal("89999")).stock(20).categoryId(1L).build();
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(userRepository.findByEmail("seller@shopwave.com")).thenReturn(Optional.of(seller));
            when(productRepository.save(any())).thenReturn(product);
            assertThat(productService.createProduct(req, "seller@shopwave.com")).isNotNull();
        }
        @Test void throwsForMissingCategory() {
            ProductRequest req = ProductRequest.builder()
                .name("Ghost").price(new BigDecimal("100")).stock(1).categoryId(999L).build();
            when(categoryRepository.findById(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> productService.createProduct(req, "seller@shopwave.com"))
                .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Test void returnsFeaturedProducts() {
        when(productRepository.findByIsFeaturedTrueAndIsActiveTrue()).thenReturn(List.of(product));
        assertThat(productService.getFeaturedProducts()).hasSize(1);
    }
}