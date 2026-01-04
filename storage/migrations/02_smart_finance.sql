-- Migration for Smart Finance Features: Recurring Expenses & Predictive Analytics
-- Database: PostgreSQL

-- Subscriptions / Recurring Expenses Table
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT DEFAULT 'AED',
    frequency TEXT DEFAULT 'monthly', -- 'monthly', 'yearly', 'weekly'
    last_detected_date DATE,
    next_expected_date DATE,
    status TEXT DEFAULT 'detected', -- 'detected' (unconfirmed), 'active' (confirmed), 'ignored'
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, vendor_name, amount)
);

-- Predictions & Insights Table (Optional: for caching complex analytics)
CREATE TABLE IF NOT EXISTS user_predictions (
    prediction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    prediction_type TEXT NOT NULL, -- 'cash_flow', 'budget_warning', 'spend_forecast'
    forecast_amount NUMERIC(15, 2),
    confidence_score NUMERIC(5, 4),
    insight_text TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON user_predictions(user_id);
