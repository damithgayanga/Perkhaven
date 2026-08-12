-- Reset all application-owned data after fixing Cognito audit actor resolution.
-- Flyway schema history is deliberately retained. In the local profile the
-- later V100/V101 migrations recreate demo data; production remains empty.
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
