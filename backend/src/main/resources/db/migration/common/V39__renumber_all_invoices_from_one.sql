-- Renumber all retained invoices into one continuous sequence starting at 00001.
-- Deployment trigger after workflow queue fix.
-- Ordering is deterministic and follows the existing numeric invoice suffix, then invoice id
-- only as a tie-breaker. The year and student-registration portions are preserved.
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

-- Move all invoices to a collision-free temporary namespace first. This avoids
-- unique-key clashes such as an old 00023 becoming the new 00012 while 00012
-- still exists during the same migration.
UPDATE invoices
SET invoice_no = CONCAT('REN-', LPAD(CAST(id AS VARCHAR), 20, '0'));

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

-- Keep persisted email metadata consistent with the revised invoice reference.
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

-- Update historical audit references that expose invoice numbers in the admin UI.
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

-- Future invoices continue immediately after the newly renumbered retained invoices.
UPDATE number_sequences
SET next_value = (SELECT COUNT(*) + 1 FROM invoices)
WHERE sequence_key = 'INVOICE';

DROP TABLE invoice_renumber_map;
