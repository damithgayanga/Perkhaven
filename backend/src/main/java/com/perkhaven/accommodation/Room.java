package com.perkhaven.accommodation;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "rooms")
public class Room extends AuditedEntity {
    @Column(name = "room_no", nullable = false, unique = true, length = 30)
    private String roomNo;
    @Column(name = "room_type", nullable = false, length = 80)
    private String type;
    @Column(nullable = false)
    private int beds;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal price;
    @Column(nullable = false)
    private boolean active = true;

    protected Room() {}
    public Room(String roomNo, String type, int beds, BigDecimal price, boolean active) { update(roomNo, type, beds, price, active); }
    public void update(String roomNo, String type, int beds, BigDecimal price, boolean active) {
        this.roomNo = roomNo; this.type = type; this.beds = beds; this.price = price; this.active = active;
    }
    public String getRoomNo() { return roomNo; }
    public String getType() { return type; }
    public int getBeds() { return beds; }
    public BigDecimal getPrice() { return price; }
    public boolean isActive() { return active; }
}
