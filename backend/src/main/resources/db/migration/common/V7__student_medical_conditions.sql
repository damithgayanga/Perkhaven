ALTER TABLE students ADD COLUMN has_medical_condition BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE students ADD COLUMN medical_condition_details VARCHAR(2000);
