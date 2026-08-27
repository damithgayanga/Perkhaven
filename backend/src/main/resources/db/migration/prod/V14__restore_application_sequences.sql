-- The production cleanup intentionally removed application rows, including
-- number_sequences. Restore every sequence required by production workflows.
INSERT INTO number_sequences (sequence_key, next_value, version)
VALUES
    ('STUDENT_REGISTRATION_V2', 1, 0),
    ('BANK_TRANSACTION', 1, 0),
    ('EXPENSE', 1, 0),
    ('PETTY_CASH_DEPOSIT', 1, 0),
    ('AGREEMENT', 1, 0),
    ('CHECKOUT_SETTLEMENT', 1, 0)
ON CONFLICT (sequence_key) DO NOTHING;
