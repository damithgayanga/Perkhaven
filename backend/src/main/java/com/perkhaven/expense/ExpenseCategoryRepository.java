package com.perkhaven.expense;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseCategoryRepository extends JpaRepository<ExpenseCategory,Long>{
 boolean existsByCode(String code);
 List<ExpenseCategory> findByMainCategoryOrderByCodeAscIdAsc(String mainCategory);
}
