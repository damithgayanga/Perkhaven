package com.perkhaven.identity;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffPermissionRepository extends JpaRepository<StaffPermission, Long> {
    List<StaffPermission> findByStaffNoOrderByPermissionKey(String staffNo);
    Optional<StaffPermission> findByStaffNoAndPermissionKey(String staffNo, String permissionKey);
}
