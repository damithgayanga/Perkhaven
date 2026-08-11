package com.perkhaven.shop;
import com.perkhaven.common.domain.AuditedEntity;import jakarta.persistence.*;
@Entity @Table(name="shop_tenant_emergency_contacts")
public class ShopTenantEmergencyContact extends AuditedEntity{
 @ManyToOne(fetch=FetchType.LAZY,optional=false)@JoinColumn(name="shop_tenant_id",nullable=false)private ShopTenant tenant;@Column(name="contact_order",nullable=false)private int order;@Column(name="contact_name",nullable=false,length=200)private String name;@Column(nullable=false,length=40)private String phone;@Column(nullable=false,length=100)private String relationship;@Column(length=600)private String address;
 protected ShopTenantEmergencyContact(){}ShopTenantEmergencyContact(ShopTenant tenant,int order,String name,String phone,String relationship,String address){this.tenant=tenant;this.order=order;this.name=name;this.phone=phone;this.relationship=relationship;this.address=address;}
 public int getOrder(){return order;}public String getName(){return name;}public String getPhone(){return phone;}public String getRelationship(){return relationship;}public String getAddress(){return address;}
}
