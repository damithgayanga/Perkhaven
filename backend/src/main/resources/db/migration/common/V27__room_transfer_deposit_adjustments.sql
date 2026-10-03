ALTER TABLE invoices DROP CONSTRAINT ck_invoice_amounts;
ALTER TABLE invoices ADD CONSTRAINT ck_invoice_amounts CHECK (
    paid_amount >= 0 AND
    (invoice_type = 'DEPOSIT_ADJUSTMENT' OR (base_amount >= 0 AND amount >= 0))
);

ALTER TABLE invoices DROP CONSTRAINT ck_invoice_month;
ALTER TABLE invoices ADD CONSTRAINT ck_invoice_month CHECK (
    (invoice_type IN ('DEPOSIT', 'DEPOSIT_ADJUSTMENT') AND billing_month IS NULL) OR
    (invoice_type = 'RENT' AND billing_month IS NOT NULL)
);
