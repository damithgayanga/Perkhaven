INSERT INTO number_sequences (sequence_key, next_value, version)
SELECT 'STUDENT_REGISTRATION_V2', 1, 0
WHERE NOT EXISTS (
    SELECT 1 FROM number_sequences WHERE sequence_key = 'STUDENT_REGISTRATION_V2'
);
