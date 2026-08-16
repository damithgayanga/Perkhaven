package com.perkhaven.common.sequence;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NumberSequenceRepository extends JpaRepository<NumberSequence, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select sequence from NumberSequence sequence where sequence.sequenceKey = :key")
    Optional<NumberSequence> findForUpdate(@Param("key") String key);
}
