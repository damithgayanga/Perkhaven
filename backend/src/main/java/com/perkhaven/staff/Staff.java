package com.perkhaven.staff;

import com.perkhaven.common.domain.AuditedEntity;
import com.perkhaven.common.domain.RecordStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "staff")
public class Staff extends AuditedEntity {
    @Column(name="staff_no", nullable=false, unique=true, length=40) private String staffNo;
    @Column(name="first_name", nullable=false, length=100) private String firstName;
    @Column(name="last_name", nullable=false, length=100) private String lastName;
    @Column(name="id_no", nullable=false, length=80) private String idNo;
    @Column(nullable=false, length=40) private String mobile;
    @Column(length=40) private String whatsapp;
    @Column(nullable=false, unique=true) private String email;
    @Column(nullable=false, length=600) private String address;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="designation_id") private StaffDesignation designation;
    @Column(name="monthly_salary", nullable=false, precision=14, scale=2) private BigDecimal monthlySalary;
    @Column(name="account_holder_name", length=200) private String accountHolderName;
    @Column(name="account_no", length=100) private String accountNo;
    @Column(length=160) private String bank;
    @Column(name="bank_branch", length=160) private String bankBranch;
    @Column(name="registered_date", nullable=false) private LocalDate registeredDate;
    @Column(name="start_date", nullable=false) private LocalDate startDate;
    @Column(name="finish_date") private LocalDate finishDate;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private RecordStatus status;
    @Column(name="photo_key") private String photoKey;
    @Column(name="photo_name") private String photoName;
    @Column(name="photo_content_type", length=120) private String photoContentType;
    @Column(name="photo_size") private Long photoSize;
    @OneToMany(mappedBy="staff",cascade=CascadeType.ALL,orphanRemoval=true) @OrderBy("order ASC")
    private java.util.List<StaffEmergencyContact> emergencyContacts=new ArrayList<>();

    protected Staff() {}
    public Staff(String staffNo) { this.staffNo = staffNo; }
    public void update(StaffData data, StaffDesignation designation) {
        firstName=data.firstName(); lastName=data.lastName(); idNo=data.idNo(); mobile=data.mobile(); whatsapp=data.whatsapp(); email=data.email();
        address=data.address(); this.designation=designation; monthlySalary=data.monthlySalary(); accountHolderName=data.accountHolderName(); accountNo=data.accountNo();
        bank=data.bank(); bankBranch=data.bankBranch(); registeredDate=data.registeredDate(); startDate=data.startDate(); finishDate=data.finishDate(); status=data.status();
        emergencyContacts.clear();
        if(data.emergencyContacts()!=null)for(int i=0;i<data.emergencyContacts().size();i++){var c=data.emergencyContacts().get(i);emergencyContacts.add(new StaffEmergencyContact(this,i+1,c.name(),c.phone(),c.relationship(),c.address()));}
    }
    public void updatePhoto(String key, String name, String contentType, long size) { photoKey = key; photoName = name; photoContentType = contentType; photoSize = size; }
    public String getStaffNo(){return staffNo;} public String getFirstName(){return firstName;} public String getLastName(){return lastName;}
    public String getIdNo(){return idNo;} public String getMobile(){return mobile;} public String getWhatsapp(){return whatsapp;} public String getEmail(){return email;}
    public String getAddress(){return address;} public StaffDesignation getDesignation(){return designation;} public BigDecimal getMonthlySalary(){return monthlySalary;}
    public String getAccountHolderName(){return accountHolderName;} public String getAccountNo(){return accountNo;} public String getBank(){return bank;}
    public String getBankBranch(){return bankBranch;} public LocalDate getRegisteredDate(){return registeredDate;} public LocalDate getStartDate(){return startDate;}
    public LocalDate getFinishDate(){return finishDate;} public RecordStatus getStatus(){return status;}
    public List<StaffEmergencyContact> getEmergencyContacts(){return emergencyContacts;}
    public String getPhotoKey(){return photoKey;} public String getPhotoName(){return photoName;} public String getPhotoContentType(){return photoContentType;} public Long getPhotoSize(){return photoSize;}
    public record StaffData(String firstName,String lastName,String idNo,String mobile,String whatsapp,String email,String address,BigDecimal monthlySalary,
                            String accountHolderName,String accountNo,String bank,String bankBranch,LocalDate registeredDate,LocalDate startDate,LocalDate finishDate,RecordStatus status,List<ContactData> emergencyContacts){}
    public record ContactData(String name,String phone,String relationship,String address){}
}
