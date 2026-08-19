package com.perkhaven.agreement;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CheckoutSettlementRepository extends JpaRepository<CheckoutSettlement, Long> {
    List<CheckoutSettlement> findAllByOrderByIssuedAtDesc();
}
