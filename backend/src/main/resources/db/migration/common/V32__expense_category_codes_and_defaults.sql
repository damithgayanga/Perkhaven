ALTER TABLE expense_categories ADD COLUMN code VARCHAR(20);

INSERT INTO expense_categories (version, created_at, updated_at, code, main_category, name, active) VALUES
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-010-01', 'Staff Expenses', 'Staff Salary', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-010-02', 'Staff Expenses', 'Staff Bonus', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-010-03', 'Staff Expenses', 'Staff Travel', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-010-04', 'Staff Expenses', 'Staff Other Expenses', TRUE),

(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-020-01', 'Administration', 'Office Supplies', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-020-02', 'Administration', 'Insurance', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-020-03', 'Administration', 'Licences and Permits', TRUE),

(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-030-01', 'Utilities', 'Internet', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-030-02', 'Utilities', 'Telephone', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-030-03', 'Utilities', 'Electricity', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-030-04', 'Utilities', 'Water', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-030-05', 'Utilities', 'Bank', TRUE),

(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-040-01', 'Owner Expenses', 'Business Development', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-040-02', 'Owner Expenses', 'Travelling', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-040-03', 'Owner Expenses', 'Other', TRUE),

(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-050-01', 'Maintenance & Repairs', 'Lights', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-050-02', 'Maintenance & Repairs', 'Plumbing Items', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-050-03', 'Maintenance & Repairs', 'Paint', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-050-04', 'Maintenance & Repairs', 'Other Maintenance', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-050-05', 'Maintenance & Repairs', 'Repairs and Maintenance', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-050-06', 'Maintenance & Repairs', 'Pest Control', TRUE),

(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-060-01', 'Housekeeping & Cleaning', 'Cleaning Items', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-060-02', 'Housekeeping & Cleaning', 'Laundry and Linen', TRUE),

(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-070-01', 'Kitchen & Supplies', 'Kitchen Items', TRUE),

(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-080-01', 'Security', 'Security', TRUE),

(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-090-01', 'Transport', 'Transport', TRUE),

(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-100-01', 'Waste Management', 'Garbage Disposal', TRUE),

(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-110-01', 'Bank Expenses', 'Interest', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-110-02', 'Bank Expenses', 'Transaction Fees', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-110-03', 'Bank Expenses', 'Other Bank Charges', TRUE),

(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-990-01', 'Other', 'Utility - Telephone', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-990-02', 'Other', 'Utility - Electricity', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-990-03', 'Other', 'Utility - Water', TRUE),
(0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'EC-990-04', 'Other', 'Other Expenses', TRUE);
