package com.perkhaven.billing;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationOutboxRepository extends JpaRepository<NotificationOutbox, Long> {
    @EntityGraph(attributePaths = {"invoice", "invoice.student", "invoice.adjustments"})
    List<NotificationOutbox> findTop10ByStatusOrderByCreatedAtAsc(String status);
}
