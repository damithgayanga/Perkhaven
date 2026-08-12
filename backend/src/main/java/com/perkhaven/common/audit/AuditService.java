package com.perkhaven.common.audit;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
    private final AuditEventRepository repository;
    public AuditService(AuditEventRepository repository) { this.repository = repository; }

    public void record(String action, String type, String reference, String detail) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        var actor = authentication == null ? null : authentication.getName();
        if (actor == null || actor.isBlank()) actor = "system";
        repository.save(new AuditEvent(actor, action, type, reference, detail));
    }
}
