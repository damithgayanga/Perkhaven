-- Recompact retained invoice numbers after the administrator's final cleanup.
-- V39 was already applied before the cleanup was complete, so this migration
-- re-runs the renumbering against the invoices that exist now.
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

UPDATE invoices
SET invoice_no = CONCAT('REN40-', LPAD(CAST(id AS VARCHAR), 20, '0'));

UPDATE invoices i
SET invoice_no = (
    SELECT m.new_invoice_no
    FROM invoice_renumber_map m
    WHERE m.invoice_id = i.id
)
WHERE EXISTS (
    SELECT 1
    FROM invoice_renumber_map m
    WHERE m.invoice_id = i.id
);

UPDATE notification_outbox n
SET subject = (
        SELECT REPLACE(n.subject, m.old_invoice_no, m.new_invoice_no)
        FROM invoice_renumber_map m
        WHERE m.invoice_id = n.invoice_id
    ),
    message_body = (
        SELECT REPLACE(n.message_body, m.old_invoice_no, m.new_invoice_no)
        FROM invoice_renumber_map m
        WHERE m.invoice_id = n.invoice_id
    ),
    attachment_name = (
        SELECT REPLACE(n.attachment_name, m.old_invoice_no, m.new_invoice_no)
        FROM invoice_renumber_map m
        WHERE m.invoice_id = n.invoice_id
    )
WHERE EXISTS (
    SELECT 1
    FROM invoice_renumber_map m
    WHERE m.invoice_id = n.invoice_id
);

UPDATE audit_events a
SET entity_reference = (
    SELECT m.new_invoice_no
    FROM invoice_renumber_map m
    WHERE m.old_invoice_no = a.entity_reference
)
WHERE EXISTS (
    SELECT 1
    FROM invoice_renumber_map m
    WHERE m.old_invoice_no = a.entity_reference
);

UPDATE audit_events a
SET detail = (
    SELECT REPLACE(a.detail, m.old_invoice_no, m.new_invoice_no)
    FROM invoice_renumber_map m
    WHERE a.detail IS NOT NULL
      AND POSITION(m.old_invoice_no IN a.detail) > 0
    ORDER BY m.invoice_id
    FETCH FIRST 1 ROW ONLY
)
WHERE a.detail IS NOT NULL
  AND EXISTS (
      SELECT 1
      FROM invoice_renumber_map m
      WHERE POSITION(m.old_invoice_no IN a.detail) > 0
  );

UPDATE number_sequences
SET next_value = (SELECT COUNT(*) + 1 FROM invoices)
WHERE sequence_key = 'INVOICE';

DROP TABLE invoice_renumber_map;
