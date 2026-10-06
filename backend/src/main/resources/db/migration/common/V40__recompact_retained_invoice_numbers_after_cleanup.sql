-- Recompact retained invoice numbers after the administrator's final cleanup.
-- V39 was already applied before the cleanup was complete, so this migration
-- deliberately re-runs the renumbering against the invoices that exist now.
CREATE TEMP TABLE invoice_renumber_map AS
SELECT
    id AS invoice_id,
    invoice_no AS old_invoice_no,
    CONCAT(
        SUBSTRING(invoice_no, 1, LENGTH(invoice_no) - 5),
        LPAD(
            CAST(
                ROW_NUMBER() OVER (
                    ORDER BY CAST(RIGHT(invoice_no, 5) AS BIGINT), id
                ) AS VARCHAR
            ),
            5,
            '0'
        )
    ) AS new_invoice_no
FROM invoices;

-- Use a collision-free temporary namespace before assigning the compact numbers.
UPDATE invoices
SET invoice_no = CONCAT('REN40-', LPAD(CAST(id AS VARCHAR), 20, '0'));

UPDATE invoices i
SET invoice_no = m.new_invoice_no
FROM invoice_renumber_map m
WHERE m.invoice_id = i.id;

-- Keep queued/stored notification metadata aligned with the revised invoice number.
UPDATE notification_outbox n
SET subject = REPLACE(n.subject, m.old_invoice_no, m.new_invoice_no),
    message_body = REPLACE(n.message_body, m.old_invoice_no, m.new_invoice_no),
    attachment_name = REPLACE(n.attachment_name, m.old_invoice_no, m.new_invoice_no)
FROM invoice_renumber_map m
WHERE m.invoice_id = n.invoice_id;

-- Update every historical audit reference, including details that may contain
-- more than one invoice number.
DO $$
DECLARE
    mapping RECORD;
BEGIN
    FOR mapping IN
        SELECT old_invoice_no, new_invoice_no
        FROM invoice_renumber_map
        ORDER BY invoice_id
    LOOP
        UPDATE audit_events
        SET entity_reference = mapping.new_invoice_no
        WHERE entity_reference = mapping.old_invoice_no;

        UPDATE audit_events
        SET detail = REPLACE(detail, mapping.old_invoice_no, mapping.new_invoice_no)
        WHERE detail IS NOT NULL
          AND POSITION(mapping.old_invoice_no IN detail) > 0;
    END LOOP;
END $$;

-- The next new invoice must follow immediately after the retained sequence.
UPDATE number_sequences
SET next_value = COALESCE((SELECT COUNT(*) + 1 FROM invoices), 1)
WHERE sequence_key = 'INVOICE';

DROP TABLE invoice_renumber_map;
