UPDATE students
SET portal_access_status = 'ACTIVE',
    portal_access_granted_at = CURRENT_TIMESTAMP,
    portal_activated_at = CURRENT_TIMESTAMP,
    portal_access_updated_by = 'local-seed'
WHERE registration_no = 'PH-2026-001';
