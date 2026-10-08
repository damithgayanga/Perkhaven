package com.perkhaven.student;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "student_drafts")
public class StudentDraft extends AuditedEntity {
    @Column(nullable = false, length = 30)
    private String status = "DRAFT";
    @Column(name = "created_by", nullable = false, length = 255)
    private String createdBy;
    @Column(name = "updated_by", nullable = false, length = 255)
    private String updatedBy;
    @Column(name = "submitted_at")
    private Instant submittedAt;
    @Column(name = "converted_at")
    private Instant convertedAt;
    @Column(name = "converted_registration_no", length = 40)
    private String convertedRegistrationNo;

    @Column(name = "first_name", length = 100) private String firstName;
    @Column(name = "middle_names", length = 180) private String middleNames;
    @Column(name = "last_name", length = 100) private String lastName;
    @Column(name = "date_of_birth") private LocalDate dateOfBirth;
    @Column(name = "id_no", length = 80) private String idNo;
    @Column(length = 40) private String mobile;
    @Column(length = 40) private String whatsapp;
    @Column(length = 255) private String email;
    @Column(length = 255) private String university;
    @Column(name = "current_year", length = 80) private String currentYear;
    @Column(length = 600) private String address;
    @Column(name = "has_medical_condition", nullable = false) private boolean hasMedicalCondition;
    @Column(name = "medical_condition_details", length = 2000) private String medicalConditionDetails;
    @Column(name = "registered_date") private LocalDate registeredDate;
    @Column(name = "start_date") private LocalDate startDate;
    @Column(name = "room_no", length = 40) private String roomNo;
    @Column(name = "requested_status", length = 20) private String requestedStatus;
    @Column(name = "emergency1_name", length = 180) private String emergency1Name;
    @Column(name = "emergency1_contact", length = 80) private String emergency1Contact;
    @Column(name = "emergency1_relationship", length = 100) private String emergency1Relationship;
    @Column(name = "emergency1_address", length = 600) private String emergency1Address;
    @Column(name = "emergency2_name", length = 180) private String emergency2Name;
    @Column(name = "emergency2_contact", length = 80) private String emergency2Contact;
    @Column(name = "emergency2_relationship", length = 100) private String emergency2Relationship;
    @Column(name = "emergency2_address", length = 600) private String emergency2Address;
    @Column(length = 2000) private String notes;

    protected StudentDraft() {}

    public StudentDraft(String actor) {
        this.createdBy = actor;
        this.updatedBy = actor;
    }

    public void update(Data data, String actor) {
        if (!"DRAFT".equals(status) && !"RETURNED".equals(status)) {
            throw new IllegalStateException("Submitted student drafts cannot be edited.");
        }
        firstName = clean(data.firstName());
        middleNames = clean(data.middleNames());
        lastName = clean(data.lastName());
        dateOfBirth = data.dateOfBirth();
        idNo = clean(data.idNo());
        mobile = clean(data.mobile());
        whatsapp = clean(data.whatsapp());
        email = clean(data.email());
        university = clean(data.university());
        currentYear = clean(data.currentYear());
        address = clean(data.address());
        hasMedicalCondition = data.hasMedicalCondition();
        medicalConditionDetails = hasMedicalCondition ? clean(data.medicalConditionDetails()) : null;
        registeredDate = data.registeredDate();
        startDate = data.startDate();
        roomNo = clean(data.roomNo());
        requestedStatus = clean(data.requestedStatus());
        emergency1Name = clean(data.emergency1Name());
        emergency1Contact = clean(data.emergency1Contact());
        emergency1Relationship = clean(data.emergency1Relationship());
        emergency1Address = clean(data.emergency1Address());
        emergency2Name = clean(data.emergency2Name());
        emergency2Contact = clean(data.emergency2Contact());
        emergency2Relationship = clean(data.emergency2Relationship());
        emergency2Address = clean(data.emergency2Address());
        notes = clean(data.notes());
        updatedBy = actor;
    }

    public void submit(String actor) {
        if (!"DRAFT".equals(status) && !"RETURNED".equals(status)) {
            throw new IllegalStateException("Only draft or returned student records can be submitted.");
        }
        if ((firstName == null || firstName.isBlank()) && (lastName == null || lastName.isBlank())) {
            throw new IllegalArgumentException("Enter at least the student's first name or last name before submitting.");
        }
        status = "SUBMITTED";
        submittedAt = Instant.now();
        updatedBy = actor;
    }

    public void markConverted(String registrationNo, String actor) {
        if (!"SUBMITTED".equals(status)) throw new IllegalStateException("Only submitted drafts can be converted.");
        status = "CONVERTED";
        convertedAt = Instant.now();
        convertedRegistrationNo = registrationNo;
        updatedBy = actor;
    }

    public boolean belongsTo(String actor) { return createdBy.equalsIgnoreCase(actor); }
    private static String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    public String getStatus() { return status; }
    public String getCreatedBy() { return createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public Instant getSubmittedAt() { return submittedAt; }
    public Instant getConvertedAt() { return convertedAt; }
    public String getConvertedRegistrationNo() { return convertedRegistrationNo; }
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
    public String getRoomNo() { return roomNo; }
    public String getRequestedStatus() { return requestedStatus; }
    public String getEmergency1Name() { return emergency1Name; }
    public String getEmergency1Contact() { return emergency1Contact; }
    public String getEmergency1Relationship() { return emergency1Relationship; }
    public String getEmergency1Address() { return emergency1Address; }
    public String getEmergency2Name() { return emergency2Name; }
    public String getEmergency2Contact() { return emergency2Contact; }
    public String getEmergency2Relationship() { return emergency2Relationship; }
    public String getEmergency2Address() { return emergency2Address; }
    public String getNotes() { return notes; }

    public record Data(String firstName, String middleNames, String lastName, LocalDate dateOfBirth,
                       String idNo, String mobile, String whatsapp, String email,
                       String university, String currentYear, String address,
                       boolean hasMedicalCondition, String medicalConditionDetails,
                       LocalDate registeredDate, LocalDate startDate,
                       String roomNo, String requestedStatus,
                       String emergency1Name, String emergency1Contact,
                       String emergency1Relationship, String emergency1Address,
                       String emergency2Name, String emergency2Contact,
                       String emergency2Relationship, String emergency2Address,
                       String notes) {}
}
