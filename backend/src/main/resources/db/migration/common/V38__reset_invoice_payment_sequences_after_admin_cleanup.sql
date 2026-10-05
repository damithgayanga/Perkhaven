-- Reset numbering baseline after admin cleanup of deleted invoice/payment records.
-- Confirmed latest retained invoice sequence: 00111
-- Confirmed latest retained payment sequence: 000110
UPDATE number_sequences SET next_value = 112 WHERE sequence_key = 'INVOICE';
UPDATE number_sequences SET next_value = 111 WHERE sequence_key = 'PAYMENT';
