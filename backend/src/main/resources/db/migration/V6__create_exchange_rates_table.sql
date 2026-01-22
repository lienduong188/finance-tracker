-- V6: Create exchange_rates table
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(19, 6) NOT NULL,
    date DATE NOT NULL,
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_currency, to_currency, date)
);

CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX idx_exchange_rates_date ON exchange_rates(date);

-- Insert some default exchange rates (VND base)
INSERT INTO exchange_rates (from_currency, to_currency, rate, date, source) VALUES
('USD', 'VND', 24500, CURRENT_DATE, 'manual'),
('EUR', 'VND', 26500, CURRENT_DATE, 'manual'),
('VND', 'USD', 0.0000408, CURRENT_DATE, 'manual'),
('VND', 'EUR', 0.0000377, CURRENT_DATE, 'manual');
