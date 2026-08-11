package com.perkhaven.shop;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name="shops")
public class Shop extends AuditedEntity {
    @Column(name="shop_no",nullable=false,unique=true,length=40) private String shopNo;
    @Column(name="standard_rent",nullable=false,precision=14,scale=2) private BigDecimal standardRent;
    @Column(nullable=false) private boolean active=true;
    protected Shop(){} public Shop(String shopNo,BigDecimal standardRent,boolean active){update(shopNo,standardRent,active);}
    public void update(String shopNo,BigDecimal standardRent,boolean active){this.shopNo=shopNo;this.standardRent=standardRent;this.active=active;}
    public String getShopNo(){return shopNo;} public BigDecimal getStandardRent(){return standardRent;} public boolean isActive(){return active;}
}
