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
    @Column(name = "id_no", nullable = false, length = 80)
    private String idNo;
    @Column(nullable = false, length = 40)
    private String mobile;
    @Column(length = 40)
    private String whatsapp;
    @Column(nullable = false, unique = true)
    private String email;
    private String university;
    @Column(name = "current_year", length = 80)
    private String currentYear;
    @Column(nullable = false, length = 600)
    private String address;
    @Column(name = "has_medical_condition", nullable = false)
    private boolean hasMedicalCondition;
    @Column(name = "medical_condition_details", length = 2000)
    private String medicalConditionDetails;
    @Column(name = "registered_date", nullable = false)
    private LocalDate registeredDate;
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    @Column(name = "vacated_date") private LocalDate vacatedDate;
    @Column(name = "notice_to_vacate_date") private LocalDate noticeToVacateDate;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;
    @Column(name = "monthly_rent", nullable = false, precision = 14, scale = 2)
    private BigDecimal monthlyRent;
    @Column(name = "deposit_payable", nullable = false, precision = 14, scale = 2)
    private BigDecimal depositPayable;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecordStatus status;
    @Column(name = "photo_key") private String photoKey;
    @Column(name = "photo_name") private String photoName;
    @Column(name = "photo_content_type", length = 120) private String photoContentType;
    @Column(name = "photo_size") private Long photoSize;

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
        emergencyContacts.clear();
        if (data.emergencyContacts() != null) {
            for (int i = 0; i < data.emergencyContacts().size(); i++) {
                var contact = data.emergencyContacts().get(i);
                emergencyContacts.add(new StudentEmergencyContact(this, i + 1, contact.name(), contact.phone(), contact.relationship(), contact.address()));
            }
        }
    }
    public void updatePhoto(String key, String name, String contentType, long size) {
        this.photoKey = key; this.photoName = name; this.photoContentType = contentType; this.photoSize = size;
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
    public List<StudentEmergencyContact> getEmergencyContacts() { return emergencyContacts; }

    public record StudentData(String firstName, String middleNames, String lastName, LocalDate dateOfBirth,
                              String idNo, String mobile, String whatsapp, String email,
                              String university, String currentYear, String address, boolean hasMedicalCondition,
                              String medicalConditionDetails, LocalDate registeredDate, LocalDate startDate,
                              LocalDate vacatedDate, LocalDate noticeToVacateDate, BigDecimal monthlyRent, BigDecimal depositPayable, RecordStatus status,
                              List<EmergencyContactData> emergencyContacts) {}
    public record EmergencyContactData(String name, String phone, String relationship, String address) {}
}
