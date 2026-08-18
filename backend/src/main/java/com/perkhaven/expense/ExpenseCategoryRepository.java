package com.perkhaven.expense;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ExpenseCategoryRepository extends JpaRepository<ExpenseCategory,Long>{}
