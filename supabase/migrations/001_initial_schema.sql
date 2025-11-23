-- Scentwork Corporate Program - Initial Database Schema
-- Run this in Supabase SQL Editor or via: supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ambassadors Table
CREATE TABLE ambassadors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50),
    country VARCHAR(100),
    company VARCHAR(255),
    referral_code VARCHAR(50),
    
    -- Status & Qualification (Admin-controlled)
    tier VARCHAR(20) NOT NULL DEFAULT 'Tier A',
    qualification_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    qualification_approved_at TIMESTAMPTZ,
    qualification_approved_by UUID,
    
    -- KYC
    kyc_complete BOOLEAN DEFAULT FALSE,
    kyc_verified_at TIMESTAMPTZ,
    
    -- User ID link to Supabase auth.users
    user_id UUID REFERENCES auth.users(id),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- 2. Partners Table
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    website VARCHAR(255),
    domain VARCHAR(255),
    
    -- Contact
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    primary_contact_title VARCHAR(100),
    
    -- Business
    hq_country VARCHAR(100),
    region VARCHAR(50),
    industry VARCHAR(100),
    employee_count INTEGER,
    
    -- Billing
    billing_address TEXT,
    tax_id VARCHAR(100),
    
    -- Distribution
    distribution_model VARCHAR(50) NOT NULL, -- 'pass_through' or 'bulk_buy'
    partner_code VARCHAR(100) UNIQUE,
    
    -- Relationship
    ambassador_id UUID NOT NULL REFERENCES ambassadors(id),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    risk_score DECIMAL(5,4),
    
    -- Commission Settings
    commission_pool DECIMAL(5,4) DEFAULT 0.35,
    dual_ten_percent BOOLEAN DEFAULT TRUE,
    
    -- User ID (if partner has login)
    user_id UUID REFERENCES auth.users(id),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- 3. Recipients Table
CREATE TABLE recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255),
    name VARCHAR(255),
    
    -- Sharing Tree
    shared_by UUID REFERENCES recipients(id),
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
    ambassador_id UUID REFERENCES ambassadors(id),
    partner_id UUID REFERENCES partners(id),
    
    -- Activity
    first_redeemed_at TIMESTAMPTZ,
    first_shared_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Purchases Table
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Customer
    recipient_id UUID NOT NULL REFERENCES recipients(id),
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    
    -- Purchase Details (amounts in cents)
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    product_id VARCHAR(50),
    product_name VARCHAR(255),
    
    -- Context
    campaign_id UUID,
    partner_id UUID REFERENCES partners(id),
    ambassador_id UUID REFERENCES ambassadors(id),
    
    -- Sharing Tree
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
    distribution_model VARCHAR(50),
    
    -- Fragrance Creation Flow Integration
    fragrance_creation_flow_id VARCHAR(50),
    checkout_completed_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed',
    refunded_at TIMESTAMPTZ,
    refund_amount_cents INTEGER,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Commissions Table
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id),
    
    -- Recipient (ambassador or partner)
    recipient_id UUID NOT NULL,
    recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('ambassador', 'partner')),
    
    -- Commission Details
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
    rate DECIMAL(5,4) NOT NULL CHECK (rate >= 0 AND rate <= 1),
    amount_cents INTEGER NOT NULL,
    purchase_amount_cents INTEGER NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    payout_period VARCHAR(20),
    paid_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Campaigns Table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partners(id),
    name VARCHAR(255) NOT NULL,
    distribution_model VARCHAR(50) NOT NULL,
    
    -- Bulk-Buy Specific
    bulk_purchase_amount_cents INTEGER,
    bulk_purchase_date TIMESTAMPTZ,
    codes_purchased INTEGER,
    
    -- Tracking
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'active',
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Share Links Table
CREATE TABLE share_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id),
    partner_id UUID REFERENCES partners(id),
    ambassador_id UUID REFERENCES ambassadors(id),
    
    url VARCHAR(500) NOT NULL UNIQUE,
    code VARCHAR(100) UNIQUE,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Tracking
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 8. Approval Queue Table
CREATE TABLE approval_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partners(id),
    
    -- Application Data
    company_name VARCHAR(255),
    website VARCHAR(255),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    industry VARCHAR(100),
    employee_count INTEGER,
    preferred_model VARCHAR(50),
    estimated_audience TEXT,
    notes TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending_review',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    risk_score DECIMAL(5,4),
    
    -- Metadata
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX idx_ambassadors_email ON ambassadors(email);
CREATE INDEX idx_ambassadors_user_id ON ambassadors(user_id);
CREATE INDEX idx_ambassadors_tier ON ambassadors(tier);
CREATE INDEX idx_ambassadors_qualification_status ON ambassadors(qualification_status);

CREATE INDEX idx_partners_ambassador_id ON partners(ambassador_id);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_partner_code ON partners(partner_code);
CREATE INDEX idx_partners_user_id ON partners(user_id);

CREATE INDEX idx_recipients_shared_by ON recipients(shared_by);
CREATE INDEX idx_recipients_ambassador_id ON recipients(ambassador_id);
CREATE INDEX idx_recipients_partner_id ON recipients(partner_id);
CREATE INDEX idx_recipients_level ON recipients(level);
CREATE INDEX idx_recipients_is_active ON recipients(is_active);

CREATE INDEX idx_purchases_recipient_id ON purchases(recipient_id);
CREATE INDEX idx_purchases_partner_id ON purchases(partner_id);
CREATE INDEX idx_purchases_ambassador_id ON purchases(ambassador_id);
CREATE INDEX idx_purchases_level ON purchases(level);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_created_at ON purchases(created_at);

CREATE INDEX idx_commissions_purchase_id ON commissions(purchase_id);
CREATE INDEX idx_commissions_recipient_id ON commissions(recipient_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_payout_period ON commissions(payout_period);
CREATE INDEX idx_commissions_level ON commissions(level);

CREATE INDEX idx_campaigns_partner_id ON campaigns(partner_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

CREATE INDEX idx_share_links_code ON share_links(code);
CREATE INDEX idx_share_links_campaign_id ON share_links(campaign_id);

CREATE INDEX idx_approval_queue_status ON approval_queue(status);
CREATE INDEX idx_approval_queue_partner_id ON approval_queue(partner_id);

-- Enable Row Level Security (RLS)
ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- Ambassadors can view and update their own data
CREATE POLICY "Ambassadors can view own data"
    ON ambassadors FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Ambassadors can update own data"
    ON ambassadors FOR UPDATE
    USING (auth.uid() = user_id);

-- Partners policies
CREATE POLICY "Ambassadors can view their partners"
    ON partners FOR SELECT
    USING (
        ambassador_id IN (
            SELECT id FROM ambassadors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Partners can view own data"
    ON partners FOR SELECT
    USING (auth.uid() = user_id);

-- Commission policies
CREATE POLICY "Users can view own commissions"
    ON commissions FOR SELECT
    USING (
        recipient_id IN (
            SELECT id FROM ambassadors WHERE user_id = auth.uid()
        )
        OR
        recipient_id IN (
            SELECT id FROM partners WHERE user_id = auth.uid()
        )
    );

-- Purchase policies
CREATE POLICY "Ambassadors can view network purchases"
    ON purchases FOR SELECT
    USING (
        ambassador_id IN (
            SELECT id FROM ambassadors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Partners can view their campaign purchases"
    ON purchases FOR SELECT
    USING (
        partner_id IN (
            SELECT id FROM partners WHERE user_id = auth.uid()
        )
    );

-- Campaign policies
CREATE POLICY "Partners can manage own campaigns"
    ON campaigns FOR ALL
    USING (
        partner_id IN (
            SELECT id FROM partners WHERE user_id = auth.uid()
        )
    );

-- Share links policies
CREATE POLICY "Users can view related share links"
    ON share_links FOR SELECT
    USING (
        partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
        OR
        ambassador_id IN (SELECT id FROM ambassadors WHERE user_id = auth.uid())
    );

-- Note: Admin users bypass RLS when using service_role key

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_ambassadors_updated_at BEFORE UPDATE ON ambassadors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipients_updated_at BEFORE UPDATE ON recipients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO ambassadors (id, email, name, tier, qualification_status, kyc_complete)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'sarah@scentwork.ai', 'Sarah Thompson', 'Tier B', 'qualified', true);

INSERT INTO partners (id, name, website, ambassador_id, distribution_model, status, partner_code, region)
VALUES 
    ('00000000-0000-0000-0000-000000000101', 'Acme Hotels', 'https://acmehotels.example', '00000000-0000-0000-0000-000000000001', 'pass_through', 'approved', 'PARTNER-ACME-8F29', 'US'),
    ('00000000-0000-0000-0000-000000000102', 'Globotel Group', 'https://globotel.example', '00000000-0000-0000-0000-000000000001', 'bulk_buy', 'pending_review', 'PARTNER-GLOBO-1A2B', 'EU');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Schema created successfully! Sample data inserted.';
END $$;

