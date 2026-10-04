package com.perkhaven.student;

import com.perkhaven.accommodation.Room;
import com.perkhaven.common.domain.AuditedEntity;
import com.perkhaven.common.domain.RecordStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "students")
public class Student extends AuditedEntity {
    @Column(name = "registration_no", nullable = false, unique = true, length = 40)
    private String registrationNo;
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;
    @Column(name = "middle_names", length = 180)
    private String middleNames;
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
    @Column(name = "id_no", length = 80)
    private String idNo;
    @Column(length = 40)
    private String mobile;
    @Column(length = 40)
    private String whatsapp;
    @Column(unique = true)
    private String email;
    private String university;
    @Column(name = "current_year", length = 80)
    private String currentYear;
    @Column(length = 600)
    private String address;
    @Column(name = "has_medical_condition", nullable = false)
    private boolean hasMedicalCondition;
    @Column(name = "medical_condition_details", length = 2000)
    private String medicalConditionDetails;
    @Column(name = "registered_date")
    private LocalDate registeredDate;
    @Column(name = "start_date")
    private LocalDate startDate;
    @Column(name = "vacated_date") private LocalDate vacatedDate;
    @Column(name = "notice_to_vacate_date") private LocalDate noticeToVacateDate;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;
    @Column(name = "monthly_rent", precision = 14, scale = 2)
    private BigDecimal monthlyRent;
    @Column(name = "deposit_payable", precision = 14, scale = 2)
    private BigDecimal depositPayable;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecordStatus status;
    @Column(name = "photo_key") private String photoKey;
    @Column(name = "photo_name") private String photoName;
    @Column(name = "photo_content_type", length = 120) private String photoContentType;
    @Column(name = "photo_size") private Long photoSize;
    @Enumerated(EnumType.STRING)
    @Column(name = "portal_access_status", nullable = false, length = 30)
    private StudentPortalAccessStatus portalAccessStatus = StudentPortalAccessStatus.NOT_GRANTED;
    @Column(name = "portal_access_granted_at") private Instant portalAccessGrantedAt;
    @Column(name = "portal_activated_at") private Instant portalActivatedAt;
    @Column(name = "portal_last_login_at") private Instant portalLastLoginAt;
    @Column(name = "portal_access_disabled_at") private Instant portalAccessDisabledAt;
    @Column(name = "portal_access_updated_by", length = 255) private String portalAccessUpdatedBy;

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("order ASC")
    private List<StudentEmergencyContact> emergencyContacts = new ArrayList<>();

    protected Student() {}
    public Student(String registrationNo) { this.registrationNo = registrationNo; }

    public void update(StudentData data, Room room) {
        this.firstName = data.firstName(); this.middleNames = data.middleNames(); this.lastName = data.lastName();
        this.dateOfBirth = data.dateOfBirth(); this.idNo = data.idNo();
        this.mobile = data.mobile(); this.whatsapp = data.whatsapp(); this.email = data.email();
        this.university = data.university(); this.currentYear = data.currentYear(); this.address = data.address();
        this.hasMedicalCondition = data.hasMedicalCondition();
        this.medicalConditionDetails = data.hasMedicalCondition() ? data.medicalConditionDetails() : null;
        this.registeredDate = data.registeredDate(); this.startDate = data.startDate(); this.vacatedDate = data.vacatedDate(); this.noticeToVacateDate = data.noticeToVacateDate(); this.room = room;
        this.monthlyRent = data.monthlyRent(); this.depositPayable = data.depositPayable(); this.status = data.status();
        updateEmergencyContacts(data.emergencyContacts());
    }

    private void updateEmergencyContacts(List<EmergencyContactData> requestedContacts) {
        var requested = requestedContacts == null ? List.<EmergencyContactData>of() : requestedContacts;
        var retained = Math.min(emergencyContacts.size(), requested.size());
        for (int i = 0; i < retained; i++) {
            var contact = requested.get(i);
            emergencyContacts.get(i).update(i + 1, contact.name(), contact.phone(), contact.relationship(), contact.address());
        }
        for (int i = emergencyContacts.size(); i < requested.size(); i++) {
            var contact = requested.get(i);
            emergencyContacts.add(new StudentEmergencyContact(this, i + 1, contact.name(), contact.phone(), contact.relationship(), contact.address()));
        }
        while (emergencyContacts.size() > requested.size()) {
            emergencyContacts.remove(emergencyContacts.size() - 1);
        }
    }
    public void updatePhoto(String key, String name, String contentType, long size) {
        this.photoKey = key; this.photoName = name; this.photoContentType = contentType; this.photoSize = size;
    }
    public void grantPortalAccess(String actor) {
        if (portalAccessGrantedAt == null) portalAccessGrantedAt = Instant.now();
        portalAccessStatus = portalActivatedAt == null ? StudentPortalAccessStatus.PENDING_REGISTRATION : StudentPortalAccessStatus.ACTIVE;
        portalAccessDisabledAt = null;
        portalAccessUpdatedBy = actor;
    }
    public void disablePortalAccess(String actor) {
        portalAccessStatus = StudentPortalAccessStatus.DISABLED;
        portalAccessDisabledAt = Instant.now();
        portalAccessUpdatedBy = actor;
    }
    public void restorePortalAccess(String actor) {
        if (portalAccessGrantedAt == null) portalAccessGrantedAt = Instant.now();
        portalAccessStatus = portalActivatedAt == null ? StudentPortalAccessStatus.PENDING_REGISTRATION : StudentPortalAccessStatus.ACTIVE;
        portalAccessDisabledAt = null;
        portalAccessUpdatedBy = actor;
    }
    public void approveCheckoutNotice(LocalDate noticeDate, LocalDate checkoutDate) {
        if (this.noticeToVacateDate == null) this.noticeToVacateDate = noticeDate;
        this.vacatedDate = checkoutDate;
    }

    public void applyRoomTransfer(Room room, BigDecimal monthlyRent, BigDecimal depositPayable) {
        this.room = room;
        this.monthlyRent = monthlyRent;
        this.depositPayable = depositPayable;
    }

    public void recordPortalLogin() {
        var now = Instant.now();
        if (portalAccessStatus == StudentPortalAccessStatus.PENDING_REGISTRATION) {
            portalAccessStatus = StudentPortalAccessStatus.ACTIVE;
            if (portalActivatedAt == null) portalActivatedAt = now;
        }
        portalLastLoginAt = now;
    }
    public boolean isPortalAccessAllowed() {
        return portalAccessStatus == StudentPortalAccessStatus.PENDING_REGISTRATION || portalAccessStatus == StudentPortalAccessStatus.ACTIVE;
    }
    public String getRegistrationNo() { return registrationNo; }
    public String getFirstName() { return firstName; }
    public String getMiddleNames() { return middleNames; }
    public String getLastName() { return lastName; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public String getIdNo() { return idNo; }
    public String getMobile() { return mobile; }
    public String getWhatsapp() { return whatsapp; }
    public String getEmail() { return email; }
    public String getUniversity() { return university; }
    public String getCurrentYear() { return currentYear; }
    public String getAddress() { return address; }
    public boolean hasMedicalCondition() { return hasMedicalCondition; }
    public String getMedicalConditionDetails() { return medicalConditionDetails; }
    public LocalDate getRegisteredDate() { return registeredDate; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getVacatedDate() { return vacatedDate; }
    public LocalDate getNoticeToVacateDate() { return noticeToVacateDate; }
    public Room getRoom() { return room; }
    public BigDecimal getMonthlyRent() { return monthlyRent; }
    public BigDecimal getDepositPayable() { return depositPayable; }
    public RecordStatus getStatus() { return status; }
    public String getPhotoKey() { return photoKey; }
    public String getPhotoName() { return photoName; }
    public String getPhotoContentType() { return photoContentType; }
    public Long getPhotoSize() { return photoSize; }
    public StudentPortalAccessStatus getPortalAccessStatus() { return portalAccessStatus; }
    public Instant getPortalAccessGrantedAt() { return portalAccessGrantedAt; }
    public Instant getPortalActivatedAt() { return portalActivatedAt; }
    public Instant getPortalLastLoginAt() { return portalLastLoginAt; }
    public Instant getPortalAccessDisabledAt() { return portalAccessDisabledAt; }
    public String getPortalAccessUpdatedBy() { return portalAccessUpdatedBy; }
    public List<StudentEmergencyContact> getEmergencyContacts() { return emergencyContacts; }

    public record StudentData(String firstName, String middleNames, String lastName, LocalDate dateOfBirth,
                              String idNo, String mobile, String whatsapp, String email,
                              String university, String currentYear, String address, boolean hasMedicalCondition,
                              String medicalConditionDetails, LocalDate registeredDate, LocalDate startDate,
                              LocalDate vacatedDate, LocalDate noticeToVacateDate, BigDecimal monthlyRent, BigDecimal depositPayable, RecordStatus status,
                              List<EmergencyContactData> emergencyContacts) {}
    public record EmergencyContactData(String name, String phone, String relationship, String address) {}
}
