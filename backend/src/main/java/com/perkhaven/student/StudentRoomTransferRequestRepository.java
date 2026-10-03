package com.perkhaven.student;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRoomTransferRequestRepository extends JpaRepository<StudentRoomTransferRequest, Long> {
    List<StudentRoomTransferRequest> findAllByOrderByCreatedAtDesc();
    List<StudentRoomTransferRequest> findByRegistrationNoIgnoreCaseOrderByCreatedAtDesc(String registrationNo);
    Optional<StudentRoomTransferRequest> findFirstByRegistrationNoIgnoreCaseAndStatusOrderByCreatedAtDesc(
            String registrationNo, String status);
    Optional<StudentRoomTransferRequest> findByRequestNo(String requestNo);
}
