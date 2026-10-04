package com.perkhaven.expense;
import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.*;

@Entity
@Table(name="expense_categories", uniqueConstraints=@UniqueConstraint(columnNames={"main_category","name"}))
public class ExpenseCategory extends AuditedEntity {
 @Column(length=20) private String code;
 @Column(name="main_category",nullable=false) private String mainCategory;
 @Column(nullable=false) private String name;
 @Column(nullable=false) private boolean active=true;

 protected ExpenseCategory(){}

 public ExpenseCategory(String code,String main,String name){
  this.code=code;
  this.mainCategory=main;
  this.name=name;
 }

 public void update(String main,String code,String name,Boolean active){
  if(main!=null)this.mainCategory=main;
  if(code!=null)this.code=code;
  if(name!=null)this.name=name;
  if(active!=null)this.active=active;
 }

 public String getCode(){return code;}
 public String getMainCategory(){return mainCategory;}
 public String getName(){return name;}
 public boolean isActive(){return active;}
}
