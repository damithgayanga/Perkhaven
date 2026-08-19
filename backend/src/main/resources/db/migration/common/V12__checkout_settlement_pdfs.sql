ALTER TABLE checkout_settlements ADD COLUMN pdf_data BYTEA;

UPDATE checkout_settlements SET pdf_data = CAST('' AS BYTEA) WHERE pdf_data IS NULL;

ALTER TABLE checkout_settlements ALTER COLUMN pdf_data SET NOT NULL;
