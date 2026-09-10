package com.perkhaven.billing;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentEvidenceSubmissionRepository extends JpaRepository<PaymentEvidenceSubmission, Long> {
    List<PaymentEvidenceSubmission> findAllByOrderByCreatedAtDescIdDesc();
    List<PaymentEvidenceSubmission> findByInvoiceStudentRegistrationNoIgnoreCaseOrderByCreatedAtDescIdDesc(String registrationNo);
    boolean existsByInvoiceIdAndStatus(Long invoiceId, PaymentEvidenceStatus status);
    @Query("select submission.evidenceKey from PaymentEvidenceSubmission submission where submission.invoice.student.id = :studentId")
    List<String> findEvidenceKeysByStudentId(@Param("studentId") Long studentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select submission from PaymentEvidenceSubmission submission where submission.id = :id")
    Optional<PaymentEvidenceSubmission> findForUpdate(@Param("id") long id);
}
