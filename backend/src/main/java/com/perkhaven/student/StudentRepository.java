package com.perkhaven.student;

import com.perkhaven.common.domain.RecordStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface StudentRepository extends JpaRepository<Student, Long>, JpaSpecificationExecutor<Student> {
    Optional<Student> findByRegistrationNoIgnoreCase(String registrationNo);
    Optional<Student> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndRegistrationNoNot(String email, String registrationNo);
    long countByRoomIdAndStatus(Long roomId, RecordStatus status);
    List<Student> findByStatusOrderByRegistrationNo(RecordStatus status);
}
