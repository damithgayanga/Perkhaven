ALTER TABLE invoices DROP CONSTRAINT ck_invoice_month;
ALTER TABLE invoices ADD CONSTRAINT ck_invoice_month CHECK (
    (invoice_type IN ('DEPOSIT', 'DEPOSIT_ADJUSTMENT', 'OTHER_CHARGE') AND billing_month IS NULL) OR
    (invoice_type = 'RENT' AND billing_month IS NOT NULL)
);
