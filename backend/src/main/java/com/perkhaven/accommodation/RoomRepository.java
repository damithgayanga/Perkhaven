package com.perkhaven.accommodation;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByRoomNoIgnoreCase(String roomNo);
    Page<Room> findByRoomNoContainingIgnoreCase(String search, Pageable pageable);
}
