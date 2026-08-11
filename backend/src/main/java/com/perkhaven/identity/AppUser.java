package com.perkhaven.identity;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_users")
public class AppUser extends AuditedEntity {
    @Column(nullable = false, unique = true, length = 120)
    private String username;
    @Column(name = "password_hash")
    private String passwordHash;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(name = "display_name", nullable = false, length = 160)
    private String displayName;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private UserRole role;
    @Column(name = "subject_type", length = 30)
    private String subjectType;
    @Column(name = "subject_reference", length = 80)
    private String subjectReference;
    @Column(nullable = false)
    private boolean active = true;

    protected AppUser() {}

    public AppUser(String username, String email, String displayName, UserRole role, String subjectType, String subjectReference) {
        this.username = username; this.email = email; this.displayName = displayName; this.role = role;
        this.subjectType = subjectType; this.subjectReference = subjectReference; this.active = true;
    }

    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public String getEmail() { return email; }
    public String getDisplayName() { return displayName; }
    public UserRole getRole() { return role; }
    public String getSubjectType() { return subjectType; }
    public String getSubjectReference() { return subjectReference; }
    public boolean isActive() { return active; }
    public void update(String email, String displayName, UserRole role, String subjectType, String subjectReference, boolean active) {
        this.email = email; this.displayName = displayName; this.role = role; this.subjectType = subjectType;
        this.subjectReference = subjectReference; this.active = active;
    }
}
