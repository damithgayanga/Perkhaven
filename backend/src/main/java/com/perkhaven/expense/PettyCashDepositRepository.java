package com.perkhaven.expense;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface PettyCashDepositRepository extends JpaRepository<PettyCashDeposit,Long>{List<PettyCashDeposit> findAllByOrderByTransactionDateDescIdDesc(); Optional<PettyCashDeposit> findByTransactionId(String id);}
