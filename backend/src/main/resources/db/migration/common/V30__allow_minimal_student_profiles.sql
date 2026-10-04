-- Allow an administrator to create a resident shell with only first and last name.
-- The remaining registration and billing fields are completed later.
ALTER TABLE students ALTER COLUMN registered_date DROP NOT NULL;
ALTER TABLE students ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE students ALTER COLUMN monthly_rent DROP NOT NULL;
ALTER TABLE students ALTER COLUMN deposit_payable DROP NOT NULL;
