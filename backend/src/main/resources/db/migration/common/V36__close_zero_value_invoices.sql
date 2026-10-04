UPDATE invoices
SET status = 'CLOSED_NIL_BALANCE'
WHERE amount = 0
  AND paid_amount = 0
  AND status NOT IN ('CANCELLED', 'CREDITED');

UPDATE invoices
SET status = 'PAID'
WHERE amount = 0
  AND paid_amount > 0
  AND status NOT IN ('CANCELLED', 'CREDITED');
