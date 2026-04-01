-- V40: Add missing exchange rate pairs (JPY, and cross-currency fallbacks)
-- These are approximate rates used as fallback when API is unavailable
INSERT INTO exchange_rates (from_currency, to_currency, rate, date, source)
VALUES
  ('USD', 'JPY',  149.5,      CURRENT_DATE, 'manual'),
  ('USD', 'EUR',  0.92,       CURRENT_DATE, 'manual'),
  ('JPY', 'USD',  0.006689,   CURRENT_DATE, 'manual'),
  ('JPY', 'VND',  163.8,      CURRENT_DATE, 'manual'),
  ('JPY', 'EUR',  0.006155,   CURRENT_DATE, 'manual'),
  ('EUR', 'USD',  1.087,      CURRENT_DATE, 'manual'),
  ('EUR', 'JPY',  162.5,      CURRENT_DATE, 'manual'),
  ('VND', 'JPY',  0.006105,   CURRENT_DATE, 'manual')
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;
