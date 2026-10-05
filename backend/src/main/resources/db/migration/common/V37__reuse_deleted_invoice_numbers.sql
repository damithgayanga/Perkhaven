-- Reuse invoice numbers deliberately deleted by an administrator.
UPDATE invoices SET invoice_no = 'INV-2026-0021-00112' WHERE invoice_no = 'INV-2026-0021-00122' AND NOT EXISTS (SELECT 1 FROM invoices existing WHERE existing.invoice_no = 'INV-2026-0021-00112');
UPDATE number_sequences SET next_value = 114 WHERE sequence_key = 'INVOICE';
