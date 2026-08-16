package com.perkhaven.billing;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findAllByOrderByPaidDateDescIdDesc();
    @Query("select payment.evidenceKey from Payment payment where payment.invoice.student.id = :studentId")
    List<String> findEvidenceKeysByStudentId(@Param("studentId") Long studentId);
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Payment payment where payment.invoice.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);
    @Query("select p.transactionId from Payment p where p.invoice.id = :invoiceId order by p.paidDate, p.id")
    List<String> findTransactionIdsByInvoiceId(@Param("invoiceId") Long invoiceId);
}
