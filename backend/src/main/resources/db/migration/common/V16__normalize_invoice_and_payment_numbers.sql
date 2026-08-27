-- Normalize legacy identifiers once while preserving their creation order.
UPDATE invoices i
SET invoice_no = CONCAT('INV-', CAST(EXTRACT(YEAR FROM COALESCE(i.billing_month, i.issue_date)) AS INTEGER), '-', RIGHT((SELECT s.registration_no FROM students s WHERE s.id = i.student_id), 4), '-', LPAD(CAST((SELECT COUNT(*) FROM invoices older WHERE older.id <= i.id) AS VARCHAR), 5, '0'));

UPDATE payments p
SET transaction_id = CONCAT('PH-PAY-', LPAD(CAST((SELECT COUNT(*) FROM payments older WHERE older.id <= p.id) AS VARCHAR), 6, '0'));

UPDATE number_sequences SET next_value = (SELECT COUNT(*) + 1 FROM invoices) WHERE sequence_key = 'INVOICE';
UPDATE number_sequences SET next_value = (SELECT COUNT(*) + 1 FROM payments) WHERE sequence_key = 'PAYMENT';
