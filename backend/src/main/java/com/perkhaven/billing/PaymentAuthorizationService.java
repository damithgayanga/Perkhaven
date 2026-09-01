package com.perkhaven.billing;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("paymentAuthorizationService")
public class PaymentAuthorizationService {
    private final PaymentRepository payments;

    public PaymentAuthorizationService(PaymentRepository payments) {
        this.payments = payments;
    }

    @Transactional(readOnly = true)
    public boolean canAccess(long paymentId, Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken token)
                || authentication.getAuthorities().stream().noneMatch(authority -> "ROLE_STUDENT".equals(authority.getAuthority()))) {
            return false;
        }
        var reference = token.getToken().getClaimAsString("subject_reference");
        var email = token.getToken().getClaimAsString("email");
        return payments.findById(paymentId).map(payment -> {
            var student = payment.getInvoice().getStudent();
            return (reference != null && student.getRegistrationNo().equalsIgnoreCase(reference))
                    || (email != null && student.getEmail().equalsIgnoreCase(email));
        }).orElse(false);
    }
}
