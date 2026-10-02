package com.perkhaven.student;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentProfileRequestRepository extends JpaRepository<StudentProfileRequest, Long> {
    List<StudentProfileRequest> findAllByOrderByCreatedAtDesc();
    List<StudentProfileRequest> findByRegistrationNoIgnoreCaseOrderByCreatedAtDesc(String registrationNo);
    Optional<StudentProfileRequest> findFirstByRegistrationNoIgnoreCaseAndStatusOrderByCreatedAtDesc(String registrationNo, String status);
}
