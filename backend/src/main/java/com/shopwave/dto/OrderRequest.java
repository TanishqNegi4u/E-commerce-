package com.shopwave.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    private List<Long> productIds;
    private String couponCode;
    private String shippingAddress;
    private String paymentMethod;
    private String notes;
}