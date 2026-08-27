ALTER TABLE checkout_settlements ADD COLUMN IF NOT EXISTS pdf_key VARCHAR(500);
ALTER TABLE checkout_settlements ALTER COLUMN pdf_data DROP NOT NULL;
ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS attachment_key VARCHAR(500);
ALTER TABLE notification_outbox ALTER COLUMN attachment_data DROP NOT NULL;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS source_file_key VARCHAR(500);
