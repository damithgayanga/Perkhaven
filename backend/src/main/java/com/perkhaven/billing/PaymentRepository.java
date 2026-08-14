package com.perkhaven.billing;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findAllByOrderByPaidDateDescIdDesc();
    @Query("select p.transactionId from Payment p where p.invoice.id = :invoiceId order by p.paidDate, p.id")
    List<String> findTransactionIdsByInvoiceId(@Param("invoiceId") Long invoiceId);
}
