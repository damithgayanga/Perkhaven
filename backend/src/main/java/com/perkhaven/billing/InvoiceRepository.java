package com.perkhaven.billing;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByStudentIdAndInvoiceType(Long studentId, InvoiceType type);
    Optional<Invoice> findByStudentIdAndInvoiceTypeAndBillingMonth(Long studentId, InvoiceType type, LocalDate billingMonth);
    List<Invoice> findByStudentRegistrationNoIgnoreCaseOrderByIssueDateDesc(String registrationNo);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<Invoice> findByStudentRegistrationNoIgnoreCaseAndStatusInOrderByDueDateAscIssueDateAscIdAsc(String registrationNo, List<InvoiceStatus> statuses);
}
