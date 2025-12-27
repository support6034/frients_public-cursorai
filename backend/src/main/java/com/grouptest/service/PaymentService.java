package com.grouptest.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grouptest.entity.PaymentBalance;
import com.grouptest.entity.PaymentHistory;
import com.grouptest.repository.PaymentBalanceRepository;
import com.grouptest.repository.PaymentHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PaymentService {
    
    @Autowired
    private PaymentBalanceRepository paymentBalanceRepository;
    
    @Autowired
    private PaymentHistoryRepository paymentHistoryRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public Integer getBalance() {
        Optional<PaymentBalance> balance = paymentBalanceRepository.findTopByOrderByUpdatedAtDesc();
        return balance.map(PaymentBalance::getBalance).orElse(0);
    }
    
    public List<PaymentHistory> getHistory(int limit) {
        return paymentHistoryRepository.findAll(
            org.springframework.data.domain.PageRequest.of(0, limit, 
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
        ).getContent();
    }
    
    @Transactional
    public PaymentHistory createCharge(Integer amount, String paymentMethod, String buyerEmail, String buyerName, String buyerTel) {
        if (amount == null || amount < 1000) {
            throw new IllegalArgumentException("최소 충전 금액은 1,000원입니다.");
        }
        
        String merchantUid = "frients_" + System.currentTimeMillis() + "_" + 
                            Long.toHexString((long)(Math.random() * Long.MAX_VALUE)).substring(0, 9);
        
        PaymentHistory history = new PaymentHistory();
        history.setAmount(amount);
        history.setPaymentMethod(paymentMethod);
        history.setStatus("pending");
        history.setMerchantUid(merchantUid);
        
        // 결제 데이터 생성
        Map<String, Object> paymentData = new HashMap<>();
        String pg = "html5_inicis";
        String payMethod = "card";
        
        if ("bank".equals(paymentMethod)) {
            payMethod = "trans";
        } else if ("virtual".equals(paymentMethod)) {
            payMethod = "vbank";
        }
        
        paymentData.put("pg", pg);
        paymentData.put("pay_method", payMethod);
        paymentData.put("merchant_uid", merchantUid);
        paymentData.put("name", "프렌츠 알림톡 충전");
        paymentData.put("amount", amount);
        paymentData.put("buyer_email", buyerEmail != null ? buyerEmail : "user@frients.com");
        paymentData.put("buyer_name", buyerName != null ? buyerName : "프렌츠 사용자");
        paymentData.put("buyer_tel", buyerTel != null ? buyerTel : "010-0000-0000");
        
        try {
            history.setPaymentData(objectMapper.writeValueAsString(paymentData));
        } catch (Exception e) {
            throw new RuntimeException("결제 데이터 생성 실패", e);
        }
        
        return paymentHistoryRepository.save(history);
    }
    
    @Transactional
    public Map<String, Object> verifyPayment(String impUid, String merchantUid, Integer amount) {
        Optional<PaymentHistory> chargeOpt = paymentHistoryRepository.findByMerchantUid(merchantUid);
        
        if (chargeOpt.isEmpty()) {
            throw new IllegalArgumentException("충전 내역을 찾을 수 없습니다.");
        }
        
        PaymentHistory charge = chargeOpt.get();
        
        // 잔액 업데이트
        Integer currentBalance = getBalance();
        Integer newBalance = currentBalance + charge.getAmount();
        
        PaymentBalance balance = new PaymentBalance();
        balance.setBalance(newBalance);
        paymentBalanceRepository.save(balance);
        
        // 충전 내역 상태 업데이트
        charge.setStatus("completed");
        charge.setImpUid(impUid);
        charge.setCompletedAt(LocalDateTime.now());
        paymentHistoryRepository.save(charge);
        
        Map<String, Object> result = new HashMap<>();
        result.put("balance", newBalance);
        result.put("chargedAmount", charge.getAmount());
        return result;
    }
    
    @Transactional
    public void failPayment(String merchantUid, String errorCode, String errorMsg) {
        Optional<PaymentHistory> chargeOpt = paymentHistoryRepository.findByMerchantUid(merchantUid);
        if (chargeOpt.isPresent()) {
            PaymentHistory charge = chargeOpt.get();
            charge.setStatus("failed");
            paymentHistoryRepository.save(charge);
        }
    }
}

