package com.perkhaven.reconciliation;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReconciliationLinkRepository extends JpaRepository<ReconciliationLink, Long> {
    List<ReconciliationLink> findAllByOrderByIdAsc();
    List<ReconciliationLink> findByBankTransactionId(Long bankTransactionId);
    void deleteByBankTransactionId(Long bankTransactionId);
    void deleteBySourceTypeAndSourceRecordId(String sourceType, Long sourceRecordId);
    Optional<ReconciliationLink> findBySourceTypeAndSourceRecordId(String sourceType, Long sourceRecordId);
}
