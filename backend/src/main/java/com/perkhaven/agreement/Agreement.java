package com.perkhaven.agreement;
import com.perkhaven.common.domain.AuditedEntity; import com.perkhaven.student.Student; import jakarta.persistence.*; import java.time.Instant;
@Entity @Table(name="agreements",uniqueConstraints=@UniqueConstraint(columnNames={"agreement_no","revision"})) public class Agreement extends AuditedEntity{
 @Column(name="agreement_no",nullable=false) private String agreementNo; @Column(nullable=false) private int revision; @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="student_id",nullable=false) private Student student; @Column(name="agreement_data_json",nullable=false,length=1000000) private String agreementDataJson; @Column(nullable=false) private String status="Pending"; @Column(name="issued_at",nullable=false) private Instant issuedAt=Instant.now(); @Column(name="signed_name") private String signedName; @Column(name="signed_at") private Instant signedAt;
 protected Agreement(){} public Agreement(String no,int rev,Student student,String json){agreementNo=no;revision=rev;this.student=student;agreementDataJson=json;}
 public void sign(String name){signedName=name;signedAt=Instant.now();status="Signed";}
 public String getAgreementNo(){return agreementNo;} public int getRevision(){return revision;} public Student getStudent(){return student;} public String getAgreementDataJson(){return agreementDataJson;} public String getStatus(){return status;} public Instant getIssuedAt(){return issuedAt;} public String getSignedName(){return signedName;} public Instant getSignedAt(){return signedAt;}
}
