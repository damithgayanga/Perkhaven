-- One-time go-live reset requested before the system enters actual use.
-- Flyway history is retained so schema migrations remain intact.
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> 'flyway_schema_history'
    LOOP
        EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', table_name);
    END LOOP;
END $$;

INSERT INTO number_sequences (sequence_key, next_value, version)
VALUES
    ('STUDENT_REGISTRATION_V2', 2, 0),
    ('BANK_TRANSACTION', 1, 0),
    ('EXPENSE', 1, 0),
    ('PETTY_CASH_DEPOSIT', 1, 0),
    ('AGREEMENT', 1, 0),
    ('CHECKOUT_SETTLEMENT', 1, 0),
    ('INVOICE', 1, 0),
    ('PAYMENT', 1, 0),
    ('PAYMENT_EVIDENCE', 1, 0);

INSERT INTO students (
    version, created_at, updated_at, registration_no, first_name, last_name,
    email, has_medical_condition, status, portal_access_status
)
VALUES (
    0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'PH-STD-00001', 'Perk', 'Haven',
    'perkhaven@gmail.com', FALSE, 'INACTIVE', 'NOT_GRANTED'
);
