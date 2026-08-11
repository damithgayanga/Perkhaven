INSERT INTO staff (version, created_at, updated_at, staff_no, first_name, last_name, id_no, mobile, whatsapp, email, address, designation_id, monthly_salary, registered_date, start_date, status)
SELECT 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'STF-2026-001', 'Demo', 'Warden', 'WARDEN-001', '0770000001', '0770000001', 'warden@perkhaven.demo', 'The Perk Haven', id, 60000.00, DATE '2026-01-01', DATE '2026-01-01', 'ACTIVE'
FROM staff_designations WHERE name = 'Hostel Warden';

INSERT INTO staff (version, created_at, updated_at, staff_no, first_name, last_name, id_no, mobile, whatsapp, email, address, designation_id, monthly_salary, registered_date, start_date, status)
SELECT 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'STF-2026-002', 'Demo', 'Staff', 'STAFF-002', '0770000002', '0770000002', 'staff@perkhaven.demo', 'The Perk Haven', id, 45000.00, DATE '2026-01-01', DATE '2026-01-01', 'ACTIVE'
FROM staff_designations WHERE name = 'Support Staff';

INSERT INTO shop_tenants (version, created_at, updated_at, registration_no, shop_id, business_name, first_name, last_name, id_no, mobile, email, address, registered_date, start_date, monthly_rent, deposit_payable, status)
SELECT 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'PHS-2026-001', id, 'Demo Shop', 'Demo', 'Tenant', 'TENANT-001', '0770000010', 'tenant@perkhaven.demo', 'The Perk Haven', DATE '2026-01-01', DATE '2026-01-01', 35000.00, 105000.00, 'ACTIVE'
FROM shops WHERE shop_no = 'Shop 1';
