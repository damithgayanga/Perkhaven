package com.perkhaven.staff;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface StaffRepository extends JpaRepository<Staff, Long>, JpaSpecificationExecutor<Staff> {
    Optional<Staff> findByStaffNoIgnoreCase(String staffNo);
    boolean existsByEmailIgnoreCaseAndStaffNoNot(String email, String staffNo);
}
