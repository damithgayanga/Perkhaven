package com.perkhaven.staff;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.*;

@Entity
@Table(name="staff_emergency_contacts")
public class StaffEmergencyContact extends AuditedEntity {
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="staff_id",nullable=false) private Staff staff;
    @Column(name="contact_order",nullable=false) private int order;
    @Column(name="contact_name",nullable=false,length=200) private String name;
    @Column(nullable=false,length=40) private String phone;
    @Column(nullable=false,length=100) private String relationship;
    @Column(length=600) private String address;
    protected StaffEmergencyContact(){}
    StaffEmergencyContact(Staff staff,int order,String name,String phone,String relationship,String address){this.staff=staff;this.order=order;this.name=name;this.phone=phone;this.relationship=relationship;this.address=address;}
    public int getOrder(){return order;} public String getName(){return name;} public String getPhone(){return phone;} public String getRelationship(){return relationship;} public String getAddress(){return address;}
}
