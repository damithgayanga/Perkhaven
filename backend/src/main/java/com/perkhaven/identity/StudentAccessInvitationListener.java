package com.perkhaven.identity;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class StudentAccessInvitationListener {
    private static final Logger log = LoggerFactory.getLogger(StudentAccessInvitationListener.class);
    private final CognitoStudentAccessService access;

    public StudentAccessInvitationListener(CognitoStudentAccessService access) {
        this.access = access;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void inviteAfterProfileCommit(StudentAccessRequestedEvent event) {
        if (!access.isConfigured()) return;
        try {
            access.invite(event.registrationNo());
        } catch (RuntimeException exception) {
            // Resident registration is already committed. The admin can safely
            // retry through Enable student access because provisioning is idempotent.
            log.error("Unable to send Cognito invitation for {}", event.registrationNo(), exception);
        }
    }
}
