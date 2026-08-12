package com.perkhaven.common.audit;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "audit_events")
public class AuditEvent extends AuditedEntity {
    @Column(nullable = false, length = 100)
    private String actor;
    @Column(nullable = false, length = 100)
    private String action;
    @Column(name = "entity_type", nullable = false, length = 80)
    private String entityType;
    @Column(name = "entity_reference", nullable = false, length = 120)
    private String entityReference;
    @Column(length = 1000)
    private String detail;

    protected AuditEvent() {}
    public AuditEvent(String actor, String action, String entityType, String entityReference, String detail) {
        this.actor = actor; this.action = action; this.entityType = entityType; this.entityReference = entityReference; this.detail = detail;
    }

    public String getActor() { return actor; }
}
