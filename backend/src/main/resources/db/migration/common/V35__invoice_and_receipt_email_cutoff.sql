ALTER TABLE payments ADD COLUMN receipt_email_status VARCHAR(40);
ALTER TABLE payments ADD COLUMN receipt_emailed_at TIMESTAMP WITH TIME ZONE;

-- Legacy monthly accommodation fee and security-deposit invoices must not be
-- sent automatically. Cancel only emails that are still pending; already-sent
-- messages cannot be recalled.
UPDATE notification_outbox
SET status = 'CANCELLED',
    last_error = 'Automatic email suppressed: invoice due before 2026-10-01'
WHERE status = 'PENDING'
  AND invoice_id IN (
      SELECT id
      FROM invoices
      WHERE due_date < DATE '2026-10-01'
        AND invoice_type IN ('RENT', 'DEPOSIT', 'DEPOSIT_ADJUSTMENT')
  );

UPDATE invoices
SET email_status = 'NOT SENT - BEFORE 01-OCT-2026'
WHERE due_date < DATE '2026-10-01'
  AND invoice_type IN ('RENT', 'DEPOSIT', 'DEPOSIT_ADJUSTMENT')
  AND email_status NOT LIKE '%SENT%';

UPDATE payments
SET receipt_email_status = 'NOT SENT - BEFORE 01-OCT-2026'
WHERE invoice_id IN (
    SELECT id
    FROM invoices
    WHERE due_date < DATE '2026-10-01'
      AND invoice_type IN ('RENT', 'DEPOSIT', 'DEPOSIT_ADJUSTMENT')
);
