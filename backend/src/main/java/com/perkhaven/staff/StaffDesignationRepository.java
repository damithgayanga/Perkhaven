package com.perkhaven.staff;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffDesignationRepository extends JpaRepository<StaffDesignation, Long> {
    Optional<StaffDesignation> findByNameIgnoreCase(String name);
    Page<StaffDesignation> findByNameContainingIgnoreCase(String search, Pageable pageable);
}
