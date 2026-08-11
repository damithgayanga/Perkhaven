package com.perkhaven.identity;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "staff_permissions", uniqueConstraints = @UniqueConstraint(name = "uk_staff_permission", columnNames = {"staff_no", "permission_key"}))
public class StaffPermission extends AuditedEntity {
    @Column(name = "staff_no", nullable = false, length = 40)
    private String staffNo;
    @Column(name = "permission_key", nullable = false, length = 80)
    private String permissionKey;
    @Column(nullable = false)
    private boolean enabled;

    protected StaffPermission() {}
    public StaffPermission(String staffNo, String permissionKey, boolean enabled) {
        this.staffNo = staffNo; this.permissionKey = permissionKey; this.enabled = enabled;
    }
    public String getStaffNo() { return staffNo; }
    public String getPermissionKey() { return permissionKey; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
