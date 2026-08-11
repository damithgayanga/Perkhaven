package com.perkhaven.staff;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "staff_designations")
public class StaffDesignation extends AuditedEntity {
    @Column(nullable = false, unique = true, length = 120)
    private String name;
    @Column(nullable = false)
    private boolean active = true;
    protected StaffDesignation() {}
    public StaffDesignation(String name, boolean active) { update(name, active); }
    public void update(String name, boolean active) { this.name = name; this.active = active; }
    public String getName() { return name; }
    public boolean isActive() { return active; }
}
