package com.grouptest.repository;

import com.grouptest.entity.PaymentBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentBalanceRepository extends JpaRepository<PaymentBalance, Long> {
    @Query("SELECT pb FROM PaymentBalance pb ORDER BY pb.updatedAt DESC")
    Optional<PaymentBalance> findTopByOrderByUpdatedAtDesc();
}

