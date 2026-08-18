package com.perkhaven.expense;
import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.*;
@Entity @Table(name="expense_categories", uniqueConstraints=@UniqueConstraint(columnNames={"main_category","name"}))
public class ExpenseCategory extends AuditedEntity {
 @Column(name="main_category",nullable=false) private String mainCategory; @Column(nullable=false) private String name; @Column(nullable=false) private boolean active=true;
 protected ExpenseCategory(){} public ExpenseCategory(String main,String name){this.mainCategory=main;this.name=name;}
 public void update(String main,String name,Boolean active){if(main!=null)this.mainCategory=main;if(name!=null)this.name=name;if(active!=null)this.active=active;}
 public String getMainCategory(){return mainCategory;} public String getName(){return name;} public boolean isActive(){return active;}
}
