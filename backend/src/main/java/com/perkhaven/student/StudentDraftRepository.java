package com.perkhaven.student;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentDraftRepository extends JpaRepository<StudentDraft, Long> {
    List<StudentDraft> findAllByOrderByUpdatedAtDesc();
    List<StudentDraft> findByCreatedByIgnoreCaseOrderByUpdatedAtDesc(String createdBy);
}
