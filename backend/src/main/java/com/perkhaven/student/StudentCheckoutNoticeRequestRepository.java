package com.perkhaven.student;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentCheckoutNoticeRequestRepository extends JpaRepository<StudentCheckoutNoticeRequest, Long> {
    List<StudentCheckoutNoticeRequest> findAllByOrderByCreatedAtDesc();
    List<StudentCheckoutNoticeRequest> findByRegistrationNoIgnoreCaseOrderByCreatedAtDesc(String registrationNo);
    Optional<StudentCheckoutNoticeRequest> findFirstByRegistrationNoIgnoreCaseAndStatusOrderByCreatedAtDesc(
            String registrationNo, String status);
}
