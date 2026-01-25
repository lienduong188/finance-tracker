-- Add credit card specific fields to accounts table
ALTER TABLE accounts ADD COLUMN credit_limit DECIMAL(19, 4);
ALTER TABLE accounts ADD COLUMN billing_day INTEGER;
ALTER TABLE accounts ADD COLUMN payment_due_day INTEGER;

-- Add constraints for billing_day and payment_due_day (must be 1-31)
ALTER TABLE accounts ADD CONSTRAINT chk_billing_day CHECK (billing_day IS NULL OR (billing_day >= 1 AND billing_day <= 31));
ALTER TABLE accounts ADD CONSTRAINT chk_payment_due_day CHECK (payment_due_day IS NULL OR (payment_due_day >= 1 AND payment_due_day <= 31));

-- Add comment
COMMENT ON COLUMN accounts.credit_limit IS 'Credit limit for credit card accounts';
COMMENT ON COLUMN accounts.billing_day IS 'Day of month when billing cycle closes (1-31)';
COMMENT ON COLUMN accounts.payment_due_day IS 'Day of month when payment is due (1-31)';
