package com.perkhaven.billing;

import com.perkhaven.security.StudentIdentityResolver;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("paymentAuthorizationService")
public class PaymentAuthorizationService {
    private final PaymentRepository payments;
    private final StudentIdentityResolver studentIdentity;

    public PaymentAuthorizationService(PaymentRepository payments, StudentIdentityResolver studentIdentity) {
        this.payments = payments;
        this.studentIdentity = studentIdentity;
    }

    @Transactional(readOnly = true)
    public boolean canAccess(long paymentId, Authentication authentication) {
        return payments.findById(paymentId)
                .map(payment -> studentIdentity.canAccess(
                        payment.getInvoice().getStudent().getRegistrationNo(), authentication))
                .orElse(false);
    }
}
