package com.perkhaven.reconciliation;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

public interface BankTransactionRepository extends JpaRepository<BankTransaction, Long> {
    List<BankTransaction> findAllByOrderByTransactionDateDescIdDesc();
    boolean existsBySourceFingerprint(String fingerprint);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<BankTransaction> findByBankTransactionId(String bankTransactionId);
}
