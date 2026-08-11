INSERT INTO rooms (version, created_at, updated_at, room_no, room_type, beds, price, active) VALUES
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '101', 'Single', 1, 22500.00, TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '102', 'Twin', 2, 27500.00, TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '103', 'Twin', 2, 27500.00, TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '104', 'Triple', 3, 20000.00, TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '105', 'Twin', 2, 25000.00, TRUE);

INSERT INTO staff_designations (version, created_at, updated_at, name, active) VALUES
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Hostel Warden', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Administrator', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Support Staff', TRUE);

INSERT INTO shops (version, created_at, updated_at, shop_no, standard_rent, active) VALUES
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Shop 1', 35000.00, TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Shop 2', 35000.00, TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Shop 3', 35000.00, TRUE);

INSERT INTO students (version, created_at, updated_at, registration_no, first_name, last_name, id_no, mobile, whatsapp, email, university, current_year, address, registered_date, start_date, room_id, monthly_rent, deposit_payable, status)
SELECT 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'PH-2026-001', 'Nethmi', 'Perera', '200178902345', '0772348871', '0772348871', 'nethmi.p@email.com', 'University of Colombo', 'Year 3', '42, Temple Road, Galle', DATE '2026-01-04', DATE '2026-01-10', id, 22500.00, 67500.00, 'ACTIVE' FROM rooms WHERE room_no = '101';
INSERT INTO students (version, created_at, updated_at, registration_no, first_name, last_name, id_no, mobile, whatsapp, email, university, current_year, address, registered_date, start_date, room_id, monthly_rent, deposit_payable, status)
SELECT 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'PH-2026-002', 'Sachini', 'Fernando', '200265501122', '0718824160', '0718824160', 'sachini.f@email.com', 'University of Sri Jayewardenepura', 'Year 2', '16, Lake View, Negombo', DATE '2026-01-16', DATE '2026-02-01', id, 27500.00, 82500.00, 'ACTIVE' FROM rooms WHERE room_no = '102';
INSERT INTO students (version, created_at, updated_at, registration_no, first_name, last_name, id_no, mobile, whatsapp, email, university, current_year, address, registered_date, start_date, room_id, monthly_rent, deposit_payable, status)
SELECT 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'PH-2026-003', 'Tharushi', 'Silva', '200087612789', '0754321189', '0754321189', 'tharushi.s@email.com', 'University of Kelaniya', 'Year 4', '8, Station Lane, Matara', DATE '2025-09-20', DATE '2025-10-01', id, 27500.00, 82500.00, 'ACTIVE' FROM rooms WHERE room_no = '103';

INSERT INTO student_emergency_contacts (version, created_at, updated_at, student_id, contact_order, contact_name, phone, relationship, address)
SELECT 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, id, 1, 'S. Perera', '0713219980', 'Mother', '42, Temple Road, Galle' FROM students WHERE registration_no = 'PH-2026-001';

INSERT INTO app_users (version, created_at, updated_at, username, password_hash, email, display_name, role, subject_type, subject_reference, active) VALUES
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin@perkhaven.demo', '{noop}PerkAdmin#2026', 'admin@perkhaven.demo', 'Admin Manager', 'ADMIN', NULL, NULL, TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'chairman@perkhaven.demo', '{noop}PerkChair#2026', 'chairman@perkhaven.demo', 'Demo Chairman', 'CHAIRMAN', NULL, NULL, TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'director@perkhaven.demo', '{noop}PerkDirector#2026', 'director@perkhaven.demo', 'Demo Managing Director', 'MANAGING_DIRECTOR', NULL, NULL, TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'warden@perkhaven.demo', '{noop}PerkWarden#2026', 'warden@perkhaven.demo', 'Demo Hostel Warden', 'WARDEN', 'STAFF', 'STF-2026-001', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'staff@perkhaven.demo', '{noop}PerkStaff#2026', 'staff@perkhaven.demo', 'Demo Staff Member', 'STAFF', 'STAFF', 'STF-2026-002', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'student@perkhaven.demo', '{noop}PerkStudent#2026', 'student@perkhaven.demo', 'Nethmi Perera', 'STUDENT', 'STUDENT', 'PH-2026-001', TRUE);

INSERT INTO number_sequences (sequence_key, next_value, version) VALUES
('STUDENT', 4, 0), ('STAFF', 1, 0), ('SHOP_TENANT', 1, 0);
