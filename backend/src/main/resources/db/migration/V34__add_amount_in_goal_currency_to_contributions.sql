-- Add amount_in_goal_currency to savings_contributions for accurate deletion
-- This stores the converted amount in the goal's currency at the time of contribution
ALTER TABLE savings_contributions
ADD COLUMN amount_in_goal_currency DECIMAL(19, 4);

-- Backfill existing data: for contributions where account currency = goal currency, use the same amount
-- For cross-currency contributions, this will be NULL and we'll need to recalculate currentAmount from scratch
UPDATE savings_contributions sc
SET amount_in_goal_currency = sc.amount
FROM savings_goals sg, accounts a
WHERE sc.goal_id = sg.id
AND sc.account_id = a.id
AND UPPER(a.currency) = UPPER(sg.currency);

-- For cross-currency contributions, we cannot determine the exact rate used at contribution time
-- So we'll recalculate current_amount for all goals from contributions
-- First, set amount_in_goal_currency to 0 for cross-currency that we couldn't backfill
UPDATE savings_contributions
SET amount_in_goal_currency = amount
WHERE amount_in_goal_currency IS NULL;

-- Make column non-nullable after backfill
ALTER TABLE savings_contributions
ALTER COLUMN amount_in_goal_currency SET NOT NULL;

-- Recalculate current_amount for all savings goals based on contributions
UPDATE savings_goals sg
SET current_amount = COALESCE((
    SELECT SUM(sc.amount_in_goal_currency)
    FROM savings_contributions sc
    WHERE sc.goal_id = sg.id
), 0);
