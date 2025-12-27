package com.grouptest.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grouptest.entity.PaymentHistory;
import com.grouptest.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {
    
    @Autowired
    private PaymentService paymentService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @GetMapping("/balance")
    public ResponseEntity<Map<String, Object>> getBalance() {
        try {
            Integer balance = paymentService.getBalance();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            Map<String, Object> data = new HashMap<>();
            data.put("balance", balance);
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getHistory(
            @RequestParam(defaultValue = "50") int limit) {
        try {
            List<PaymentHistory> history = paymentService.getHistory(limit);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", history);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/charge")
    public ResponseEntity<Map<String, Object>> charge(@RequestBody Map<String, Object> request) {
        try {
            Integer amount = Integer.parseInt(request.get("amount").toString());
            String paymentMethod = (String) request.getOrDefault("payment_method", "card");
            String buyerEmail = (String) request.getOrDefault("buyer_email", null);
            String buyerName = (String) request.getOrDefault("buyer_name", null);
            String buyerTel = (String) request.getOrDefault("buyer_tel", null);
            
            PaymentHistory charge = paymentService.createCharge(amount, paymentMethod, buyerEmail, buyerName, buyerTel);
            
            Map<String, Object> paymentData;
            try {
                paymentData = objectMapper.readValue(
                    charge.getPaymentData(), 
                    new TypeReference<Map<String, Object>>() {}
                );
            } catch (Exception e) {
                paymentData = new HashMap<>();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            Map<String, Object> data = new HashMap<>();
            data.put("chargeId", charge.getId());
            data.put("merchantUid", charge.getMerchantUid());
            data.put("paymentData", paymentData);
            data.put("message", "결제를 진행해주세요.");
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verify(@RequestBody Map<String, Object> request) {
        try {
            String impUid = (String) request.get("imp_uid");
            String merchantUid = (String) request.get("merchant_uid");
            Integer amount = request.get("amount") != null ? 
                Integer.parseInt(request.get("amount").toString()) : null;
            
            Map<String, Object> result = paymentService.verifyPayment(impUid, merchantUid, amount);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", result);
            response.put("message", "충전이 완료되었습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/fail")
    public ResponseEntity<Map<String, Object>> fail(@RequestBody Map<String, Object> request) {
        try {
            String merchantUid = (String) request.get("merchant_uid");
            String errorCode = (String) request.getOrDefault("error_code", null);
            String errorMsg = (String) request.getOrDefault("error_msg", null);
            
            paymentService.failPayment(merchantUid, errorCode, errorMsg);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "실패 내역이 저장되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

