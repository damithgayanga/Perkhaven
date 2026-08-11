package com.perkhaven.student;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "student_emergency_contacts")
public class StudentEmergencyContact extends AuditedEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;
    @Column(name = "contact_order", nullable = false)
    private int order;
    @Column(name = "contact_name", nullable = false, length = 200)
    private String name;
    @Column(nullable = false, length = 40)
    private String phone;
    @Column(nullable = false, length = 100)
    private String relationship;
    @Column(length = 600)
    private String address;

    protected StudentEmergencyContact() {}
    StudentEmergencyContact(Student student, int order, String name, String phone, String relationship, String address) {
        this.student = student; this.order = order; this.name = name; this.phone = phone; this.relationship = relationship; this.address = address;
    }
    public int getOrder() { return order; }
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public String getRelationship() { return relationship; }
    public String getAddress() { return address; }
}
