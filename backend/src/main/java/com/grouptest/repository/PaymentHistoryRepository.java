package com.grouptest.repository;

import com.grouptest.entity.PaymentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, Long> {
    List<PaymentHistory> findByOrderByCreatedAtDesc(Pageable pageable);
    Optional<PaymentHistory> findByMerchantUid(String merchantUid);
}

