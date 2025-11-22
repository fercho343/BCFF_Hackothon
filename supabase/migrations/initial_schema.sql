-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'category',
    is_default BOOLEAN DEFAULT false,
    monthly_budget DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create avatar_states table
CREATE TABLE avatar_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fitness_level DECIMAL(3,2) DEFAULT 0.50 CHECK (fitness_level >= 0 AND fitness_level <= 1),
    weight_level DECIMAL(3,2) DEFAULT 0.50 CHECK (weight_level >= 0 AND weight_level <= 1),
    stress_level DECIMAL(3,2) DEFAULT 0.50 CHECK (stress_level >= 0 AND stress_level <= 1),
    happiness_level DECIMAL(3,2) DEFAULT 0.50 CHECK (happiness_level >= 0 AND happiness_level <= 1),
    body_type VARCHAR(20) DEFAULT 'average',
    appearance_data JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, color, icon, is_default, monthly_budget) VALUES
('Food & Dining', '#EF4444', 'utensils', true, 500.00),
('Exercise & Fitness', '#10B981', 'dumbbell', true, 200.00),
('Entertainment', '#F59E0B', 'film', true, 300.00),
('Transportation', '#8B5CF6', 'car', true, 400.00),
('Shopping', '#EC4899', 'shopping-bag', true, 250.00),
('Healthcare', '#06B6D4', 'heart', true, 200.00),
('Education', '#84CC16', 'book', true, 150.00),
('Savings', '#22C55E', 'piggy-bank', true, 1000.00),
('Income', '#059669', 'dollar-sign', true, 0.00);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_states ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own categories" ON categories FOR SELECT 
    USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can create own categories" ON categories FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories FOR DELETE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON transactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own avatar state" ON avatar_states FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar state" ON avatar_states FOR UPDATE 
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON categories TO anon;
GRANT ALL PRIVILEGES ON categories TO authenticated;
GRANT SELECT ON transactions TO anon;
GRANT ALL PRIVILEGES ON transactions TO authenticated;
GRANT SELECT ON avatar_states TO anon;
GRANT ALL PRIVILEGES ON avatar_states TO authenticated;

-- Create function to update avatar state based on spending
CREATE OR REPLACE FUNCTION update_avatar_state()
RETURNS TRIGGER AS $$
BEGIN
    -- Update avatar state based on recent spending patterns
    UPDATE avatar_states 
    SET 
        fitness_level = CASE 
            WHEN (SELECT SUM(amount) FROM transactions 
                  WHERE user_id = NEW.user_id 
                  AND category_id = (SELECT id FROM categories WHERE name = 'Exercise & Fitness' LIMIT 1)
                  AND transaction_date > CURRENT_DATE - INTERVAL '30 days') > 200 THEN 0.8
            ELSE 0.4
        END,
        weight_level = CASE 
            WHEN (SELECT SUM(amount) FROM transactions 
                  WHERE user_id = NEW.user_id 
                  AND category_id = (SELECT id FROM categories WHERE name = 'Food & Dining' LIMIT 1)
                  AND transaction_date > CURRENT_DATE - INTERVAL '30 days') > 600 THEN 0.8
            ELSE 0.4
        END,
        stress_level = CASE 
            WHEN (SELECT COUNT(*) FROM transactions 
                  WHERE user_id = NEW.user_id 
                  AND transaction_type = 'expense'
                  AND transaction_date > CURRENT_DATE - INTERVAL '7 days') > 20 THEN 0.8
            ELSE 0.3
        END,
        happiness_level = CASE 
            WHEN (SELECT SUM(amount) FROM transactions 
                  WHERE user_id = NEW.user_id 
                  AND transaction_type = 'income'
                  AND transaction_date > CURRENT_DATE - INTERVAL '30 days') > 
                 (SELECT SUM(amount) FROM transactions 
                  WHERE user_id = NEW.user_id 
                  AND transaction_type = 'expense'
                  AND transaction_date > CURRENT_DATE - INTERVAL '30 days') THEN 0.8
            ELSE 0.5
        END,
        last_updated = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update avatar state after transaction insert
CREATE TRIGGER update_avatar_after_transaction
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_avatar_state();
