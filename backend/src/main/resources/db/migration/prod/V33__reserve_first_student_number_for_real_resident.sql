-- Keep the permanent resident sequence reserved for real residents.
-- The standing test profile uses a separate test-only registration number.
UPDATE students
SET registration_no = 'PH-TST-00001',
    updated_at = CURRENT_TIMESTAMP
WHERE registration_no = 'PH-STD-00001'
  AND first_name = 'Perk'
  AND last_name = 'Haven';

UPDATE number_sequences
SET next_value = 1
WHERE sequence_key = 'STUDENT_REGISTRATION_V2';
