# Scentwork Corporate Program - Database Schema

**Version:** 1.0  
**Database Type:** PostgreSQL (recommended) or MySQL  
**Last Updated:** November 2024

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Core Tables](#core-tables)
3. [Relationship Diagram](#relationship-diagram)
4. [Indexes](#indexes)
5. [Sample Queries](#sample-queries)

---

## Schema Overview

The database supports the Scentwork Corporate Program with:
- Ambassador and Partner management
- Commission tracking (Levels 1-5)
- Sharing tree structure
- Purchase tracking
- Approval workflows

**Currency:** All monetary values stored in USD (cents as integers for precision)

---

## Core Tables

### 1. `ambassadors`

Stores Scentwork Ambassador accounts.

```sql
CREATE TABLE ambassadors (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50),
    country VARCHAR(100),
    company VARCHAR(255),
    referral_code VARCHAR(50),
    
    -- Status & Qualification
    tier VARCHAR(20) NOT NULL DEFAULT 'Tier A', -- 'Tier A' or 'Tier B'
    qualification_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'qualified', 'suspended'
    qualification_approved_at TIMESTAMP,
    qualification_approved_by VARCHAR(50), -- admin user id
    
    -- KYC
    kyc_complete BOOLEAN DEFAULT FALSE,
    kyc_verified_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP
);

CREATE INDEX idx_ambassadors_email ON ambassadors(email);
CREATE INDEX idx_ambassadors_qualification_status ON ambassadors(qualification_status);
CREATE INDEX idx_ambassadors_tier ON ambassadors(tier);
```

**Key Fields:**
- `qualification_status`: Admin-controlled, not based on participant count
- `tier`: Current tier level
- `qualification_approved_by`: Admin who approved qualification

---

### 2. `partners`

Stores Scentwork Partner (corporate) accounts.

```sql
CREATE TABLE partners (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    website VARCHAR(255),
    domain VARCHAR(255),
    
    -- Contact Information
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    primary_contact_title VARCHAR(100),
    
    -- Business Information
    hq_country VARCHAR(100),
    region VARCHAR(50), -- 'US', 'EU', etc.
    industry VARCHAR(100),
    employee_count INTEGER,
    
    -- Billing
    billing_address TEXT,
    tax_id VARCHAR(100),
    vat_number VARCHAR(100),
    
    -- Distribution Model
    distribution_model VARCHAR(50) NOT NULL, -- 'pass_through' or 'bulk_buy'
    partner_code VARCHAR(100) UNIQUE, -- e.g., 'PARTNER-ACME-8F29'
    
    -- Relationship
    introduced_by VARCHAR(50) NOT NULL, -- ambassador_id
    ambassador_id VARCHAR(50) NOT NULL, -- FK to ambassadors
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending_review', 
    -- 'pending_review', 'approved', 'rejected', 'paused', 'suspended'
    
    -- Approval
    approved_at TIMESTAMP,
    approved_by VARCHAR(50), -- admin user id
    risk_score DECIMAL(5,4), -- 0.0000 to 1.0000
    
    -- Commission Settings
    commission_pool DECIMAL(5,4) DEFAULT 0.35, -- 35%
    dual_ten_percent BOOLEAN DEFAULT TRUE, -- For pass-through Level 1
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP,
    
    FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id),
    FOREIGN KEY (introduced_by) REFERENCES ambassadors(id)
);

CREATE INDEX idx_partners_ambassador_id ON partners(ambassador_id);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_partner_code ON partners(partner_code);
CREATE INDEX idx_partners_domain ON partners(domain);
```

**Key Fields:**
- `distribution_model`: 'pass_through' or 'bulk_buy'
- `status`: Approval workflow status
- `partner_code`: Unique identifier for tracking

---

### 3. `campaigns`

Stores distribution campaigns created by Partners.

```sql
CREATE TABLE campaigns (
    id VARCHAR(50) PRIMARY KEY,
    partner_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    distribution_model VARCHAR(50) NOT NULL, -- 'pass_through' or 'bulk_buy'
    
    -- Bulk-Buy Specific
    bulk_purchase_amount INTEGER, -- in cents
    bulk_purchase_date TIMESTAMP,
    codes_purchased INTEGER,
    
    -- Tracking
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed'
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (partner_id) REFERENCES partners(id)
);

CREATE INDEX idx_campaigns_partner_id ON campaigns(partner_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
```

---

### 4. `share_links`

Stores unique shareable links for tracking.

```sql
CREATE TABLE share_links (
    id VARCHAR(50) PRIMARY KEY,
    campaign_id VARCHAR(50),
    partner_id VARCHAR(50),
    ambassador_id VARCHAR(50),
    
    url VARCHAR(500) NOT NULL UNIQUE,
    code VARCHAR(100) UNIQUE,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Tracking
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (partner_id) REFERENCES partners(id),
    FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id)
);

CREATE INDEX idx_share_links_code ON share_links(code);
CREATE INDEX idx_share_links_url ON share_links(url);
```

---

### 5. `recipients`

Stores end users who receive and can share codes/links.

```sql
CREATE TABLE recipients (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255),
    name VARCHAR(255),
    
    -- Sharing Tree
    shared_by VARCHAR(50), -- recipient_id who shared with them
    level INTEGER NOT NULL, -- 1-5 in sharing tree
    ambassador_id VARCHAR(50), -- Root ambassador
    partner_id VARCHAR(50), -- If came from partner
    
    -- Activity
    first_redeemed_at TIMESTAMP,
    first_shared_at TIMESTAMP,
    is_active BOOLEAN DEFAULT FALSE, -- Has redeemed/shared AND generated purchase/share
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (shared_by) REFERENCES recipients(id),
    FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id),
    FOREIGN KEY (partner_id) REFERENCES partners(id)
);

CREATE INDEX idx_recipients_shared_by ON recipients(shared_by);
CREATE INDEX idx_recipients_ambassador_id ON recipients(ambassador_id);
CREATE INDEX idx_recipients_partner_id ON recipients(partner_id);
CREATE INDEX idx_recipients_level ON recipients(level);
CREATE INDEX idx_recipients_is_active ON recipients(is_active);
```

**Key Fields:**
- `level`: Position in sharing tree (1-5)
- `is_active`: Has redeemed/shared AND generated purchase/share
- `shared_by`: Creates the sharing tree structure

---

### 6. `purchases`

Stores product purchases with commission tracking.

```sql
CREATE TABLE purchases (
    id VARCHAR(50) PRIMARY KEY,
    
    -- Customer
    recipient_id VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    
    -- Purchase Details
    amount INTEGER NOT NULL, -- in cents (USD)
    currency VARCHAR(3) DEFAULT 'USD',
    product_id VARCHAR(50),
    product_name VARCHAR(255),
    
    -- Distribution Context
    campaign_id VARCHAR(50),
    partner_id VARCHAR(50),
    ambassador_id VARCHAR(50),
    share_link_id VARCHAR(50),
    
    -- Sharing Tree
    level INTEGER NOT NULL, -- 1-5
    distribution_model VARCHAR(50), -- 'pass_through' or 'bulk_buy'
    
    -- Purchase Flow (Pass-Through)
    fragrance_creation_flow_id VARCHAR(50), -- ID from fragrance creation system
    checkout_completed_at TIMESTAMP,
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'refunded', 'cancelled'
    refunded_at TIMESTAMP,
    refund_amount INTEGER, -- in cents
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (recipient_id) REFERENCES recipients(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (partner_id) REFERENCES partners(id),
    FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id),
    FOREIGN KEY (share_link_id) REFERENCES share_links(id)
);

CREATE INDEX idx_purchases_recipient_id ON purchases(recipient_id);
CREATE INDEX idx_purchases_partner_id ON purchases(partner_id);
CREATE INDEX idx_purchases_ambassador_id ON purchases(ambassador_id);
CREATE INDEX idx_purchases_level ON purchases(level);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_created_at ON purchases(created_at);
```

**Key Fields:**
- `amount`: Stored in cents (e.g., $100.00 = 10000)
- `level`: Position in sharing tree for commission calculation
- `fragrance_creation_flow_id`: Links to fragrance creation system

---

### 7. `commissions`

Stores commission records for each purchase.

```sql
CREATE TABLE commissions (
    id VARCHAR(50) PRIMARY KEY,
    purchase_id VARCHAR(50) NOT NULL,
    
    -- Recipient
    recipient_id VARCHAR(50) NOT NULL,
    recipient_type VARCHAR(50) NOT NULL, -- 'ambassador' or 'partner'
    
    -- Commission Details
    level INTEGER NOT NULL, -- 1-5
    rate DECIMAL(5,4) NOT NULL, -- 0.1000 (10%), 0.0750 (7.5%), 0.0250 (2.5%)
    amount INTEGER NOT NULL, -- in cents
    purchase_amount INTEGER NOT NULL, -- original purchase amount in cents
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'reversed'
    payout_period VARCHAR(20), -- '2025-11' format
    paid_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (purchase_id) REFERENCES purchases(id),
    FOREIGN KEY (recipient_id) REFERENCES ambassadors(id) OR REFERENCES partners(id)
);

CREATE INDEX idx_commissions_purchase_id ON commissions(purchase_id);
CREATE INDEX idx_commissions_recipient_id ON commissions(recipient_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_payout_period ON commissions(payout_period);
CREATE INDEX idx_commissions_level ON commissions(level);
```

**Key Fields:**
- `amount`: Commission in cents
- `rate`: Commission rate (0.10, 0.075, 0.025)
- `payout_period`: For monthly payout grouping

---

### 8. `approval_queue`

Stores Partner applications awaiting admin review.

```sql
CREATE TABLE approval_queue (
    id VARCHAR(50) PRIMARY KEY,
    partner_id VARCHAR(50) NOT NULL,
    
    -- Application Data (snapshot at submission)
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
    -- 'pending_review', 'approved', 'rejected', 'changes_requested'
    
    -- Review
    reviewed_by VARCHAR(50), -- admin user id
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    risk_score DECIMAL(5,4),
    
    -- Metadata
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (partner_id) REFERENCES partners(id)
);

CREATE INDEX idx_approval_queue_status ON approval_queue(status);
CREATE INDEX idx_approval_queue_submitted_at ON approval_queue(submitted_at);
```

---

### 9. `ambassador_applications`

Stores public Ambassador applications.

```sql
CREATE TABLE ambassador_applications (
    id VARCHAR(50) PRIMARY KEY,
    
    -- Personal Information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(50),
    country VARCHAR(100),
    company VARCHAR(255),
    referral_code VARCHAR(50),
    
    -- Network Information
    estimated_network_size VARCHAR(50), -- '<10', '10-50', '50-250', '>250'
    preferred_model VARCHAR(50), -- 'prepaid', 'pass', 'both'
    notes TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by VARCHAR(50),
    reviewed_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ambassador_applications_email ON ambassador_applications(email);
CREATE INDEX idx_ambassador_applications_status ON ambassador_applications(status);
```

---

### 10. `payouts`

Stores commission payout records.

```sql
CREATE TABLE payouts (
    id VARCHAR(50) PRIMARY KEY,
    recipient_id VARCHAR(50) NOT NULL,
    recipient_type VARCHAR(50) NOT NULL, -- 'ambassador' or 'partner'
    
    -- Payout Details
    period VARCHAR(20) NOT NULL, -- '2025-11'
    total_amount INTEGER NOT NULL, -- in cents
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Breakdown
    level1_amount INTEGER DEFAULT 0,
    level2_amount INTEGER DEFAULT 0,
    level3_amount INTEGER DEFAULT 0,
    level4_amount INTEGER DEFAULT 0,
    level5_amount INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'failed'
    paid_at TIMESTAMP,
    payment_reference VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payouts_recipient_id ON payouts(recipient_id);
CREATE INDEX idx_payouts_period ON payouts(period);
CREATE INDEX idx_payouts_status ON payouts(status);
```

---

### 11. `sharing_tree`

Optimized table for sharing tree traversal (optional, can be computed from recipients).

```sql
CREATE TABLE sharing_tree (
    id VARCHAR(50) PRIMARY KEY,
    recipient_id VARCHAR(50) NOT NULL,
    parent_id VARCHAR(50), -- recipient_id of parent
    ambassador_id VARCHAR(50) NOT NULL,
    partner_id VARCHAR(50),
    
    level INTEGER NOT NULL, -- 1-5
    path VARCHAR(500), -- e.g., 'amb_001/partner_001/recip_001/recip_002'
    
    -- Statistics
    total_purchases INTEGER DEFAULT 0,
    total_revenue INTEGER DEFAULT 0, -- in cents
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (recipient_id) REFERENCES recipients(id),
    FOREIGN KEY (parent_id) REFERENCES recipients(id),
    FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id),
    FOREIGN KEY (partner_id) REFERENCES partners(id)
);

CREATE INDEX idx_sharing_tree_parent_id ON sharing_tree(parent_id);
CREATE INDEX idx_sharing_tree_ambassador_id ON sharing_tree(ambassador_id);
CREATE INDEX idx_sharing_tree_level ON sharing_tree(level);
CREATE INDEX idx_sharing_tree_path ON sharing_tree(path);
```

---

## Relationship Diagram

```
ambassadors (1) ──< (many) partners
    │                      │
    │                      │
    │                      │
    └──< (many) recipients >──┘
              │
              │
              └──< (many) purchases
                        │
                        └──< (many) commissions
```

**Key Relationships:**
- One Ambassador can have many Partners
- One Partner belongs to one Ambassador
- Recipients can be shared by other Recipients (sharing tree)
- Purchases generate multiple Commissions (one per recipient at each level)

---

## Sample Queries

### Get Ambassador Dashboard Data

```sql
-- Ambassador info
SELECT * FROM ambassadors WHERE id = 'ambassador_001';

-- Partner count
SELECT 
    COUNT(*) FILTER (WHERE status = 'approved') as active_partners,
    COUNT(*) FILTER (WHERE status != 'approved') as pending_partners
FROM partners 
WHERE ambassador_id = 'ambassador_001';

-- Commission by level
SELECT 
    level,
    SUM(amount) as total_commission
FROM commissions c
JOIN purchases p ON c.purchase_id = p.id
WHERE c.recipient_id = 'ambassador_001' 
  AND c.recipient_type = 'ambassador'
  AND p.status = 'completed'
GROUP BY level
ORDER BY level;
```

### Calculate Commission for Purchase

```sql
-- For Pass-Through Model Level 1
INSERT INTO commissions (id, purchase_id, recipient_id, recipient_type, level, rate, amount, purchase_amount)
VALUES 
  ('comm_001', 'purchase_123', 'ambassador_001', 'ambassador', 1, 0.10, 1000, 10000),
  ('comm_002', 'purchase_123', 'partner_001', 'partner', 1, 0.10, 1000, 10000);

-- For Levels 2-5 (traverse sharing tree)
WITH RECURSIVE tree AS (
    SELECT id, shared_by, level, 1 as depth
    FROM recipients
    WHERE id = 'recipient_123' -- purchase customer
    
    UNION ALL
    
    SELECT r.id, r.shared_by, r.level, t.depth + 1
    FROM recipients r
    JOIN tree t ON r.id = t.shared_by
    WHERE t.depth < 5
)
SELECT * FROM tree WHERE depth <= 5;
```

### Get Partner Commission Summary

```sql
SELECT 
    p.level,
    COUNT(DISTINCT p.id) as purchase_count,
    SUM(p.amount) as total_revenue,
    SUM(c.amount) as total_commission
FROM purchases p
JOIN commissions c ON p.id = c.purchase_id
WHERE c.recipient_id = 'partner_001'
  AND c.recipient_type = 'partner'
  AND p.status = 'completed'
GROUP BY p.level
ORDER BY p.level;
```

---

## Data Types & Constraints

### Monetary Values
- **Storage:** INTEGER (cents)
- **Example:** $100.50 stored as 10050
- **Precision:** Avoids floating-point errors

### Status Fields
- Use ENUM or VARCHAR with CHECK constraints
- Standardize status values across tables

### Timestamps
- Use TIMESTAMP WITH TIME ZONE for global support
- Always include `created_at` and `updated_at`

### Foreign Keys
- Cascade deletes where appropriate
- Set NULL for optional relationships

---

## Migration Script Example

```sql
-- Create tables in order (respecting foreign keys)
BEGIN;

CREATE TABLE ambassadors (...);
CREATE TABLE partners (...);
CREATE TABLE campaigns (...);
CREATE TABLE share_links (...);
CREATE TABLE recipients (...);
CREATE TABLE purchases (...);
CREATE TABLE commissions (...);
CREATE TABLE approval_queue (...);
CREATE TABLE ambassador_applications (...);
CREATE TABLE payouts (...);
CREATE TABLE sharing_tree (...);

-- Create indexes
CREATE INDEX idx_ambassadors_email ON ambassadors(email);
-- ... (all other indexes)

COMMIT;
```

---

## Notes for Developers

1. **Currency:** All amounts stored in cents (INTEGER) to avoid floating-point precision issues
2. **Sharing Tree:** Can be computed from `recipients.shared_by` or use `sharing_tree` table for optimization
3. **Commission Calculation:** Trigger or stored procedure recommended for real-time calculation
4. **Soft Deletes:** Use `deleted_at` instead of hard deletes for audit trail
5. **Indexes:** Critical for performance on large datasets, especially sharing tree queries

---

**Schema Version:** 1.0  
**Last Updated:** November 2024



