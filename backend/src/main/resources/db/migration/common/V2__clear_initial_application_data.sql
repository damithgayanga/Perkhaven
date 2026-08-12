-- One-time cleanup before the production registers are handed over for real use.
-- Flyway's own schema history is intentionally preserved. Local demo data is
-- inserted later by the local-only V100/V101 migrations and never reaches prod.
DELETE FROM shop_tenant_emergency_contacts;
DELETE FROM shop_tenants;
DELETE FROM shops;
DELETE FROM staff_emergency_contacts;
DELETE FROM staff_permissions;
DELETE FROM staff;
DELETE FROM staff_designations;
DELETE FROM student_emergency_contacts;
DELETE FROM students;
DELETE FROM rooms;
DELETE FROM app_users;
DELETE FROM number_sequences;
DELETE FROM audit_events;
