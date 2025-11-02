-- Revert phone and email back to NOT NULL
-- This reverts the incorrect migration that made contact fields optional

-- First, update any null values to temporary values (shouldn't be any in dev)
UPDATE studios SET phone = '+4900000000' WHERE phone IS NULL;
UPDATE studios SET email = 'temp@example.com' WHERE email IS NULL;

-- Then make columns NOT NULL
ALTER TABLE studios ALTER COLUMN phone SET NOT NULL;
ALTER TABLE studios ALTER COLUMN email SET NOT NULL;
