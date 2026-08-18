package com.perkhaven.expense;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface ExpenseRepository extends JpaRepository<Expense,Long>{List<Expense> findAllByOrderByTransactionDateDescIdDesc(); Optional<Expense> findByTransactionId(String id);}
