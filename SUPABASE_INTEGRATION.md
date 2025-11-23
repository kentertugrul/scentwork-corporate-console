# Supabase Integration Guide - Scentwork Corporate Console

**Version:** 1.0  
**Last Updated:** November 2024  
**Purpose:** Step-by-step guide to integrate Scentwork Corporate Console with Supabase backend

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Supabase Setup](#supabase-setup)
4. [Database Schema Migration](#database-schema-migration)
5. [Authentication Setup](#authentication-setup)
6. [Frontend Integration](#frontend-integration)
7. [API Functions](#api-functions)
8. [Testing](#testing)

---

## Overview

This guide integrates the Scentwork Corporate Console with Supabase, providing:
- **Database:** PostgreSQL (built into Supabase)
- **Authentication:** Row-level security and user management
- **Real-time:** Live updates for dashboard data
- **Storage:** File uploads for logos/documents
- **Edge Functions:** Server-side logic for commission calculations

---

## Prerequisites

### Required Accounts
- [ ] Supabase account (free tier available at https://supabase.com)
- [ ] GitHub account (for deployment)

### Required Tools
```bash
npm install -g supabase
```

---

## Supabase Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign in with GitHub
3. Click "New Project"
4. Fill in:
   - **Name:** `scentwork-corporate`
   - **Database Password:** (save this securely)
   - **Region:** Choose closest to your users
5. Wait ~2 minutes for project creation

### Step 2: Get Project Credentials

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **Anon/Public Key:** `eyJhbGc...` (public, safe for frontend)
   - **Service Role Key:** `eyJhbGc...` (secret, server-side only)

### Step 3: Install Supabase Client

```bash
cd "/Users/kentertugrul/Desktop/Scentwork Corporate"
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

## Database Schema Migration

### Step 1: Create SQL Migration File

Create `supabase/migrations/001_initial_schema.sql`:

```sql
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
    
    -- User ID link
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
    distribution_model VARCHAR(50) NOT NULL,
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
    level INTEGER NOT NULL,
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
    
    -- Purchase Details
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    product_id VARCHAR(50),
    product_name VARCHAR(255),
    
    -- Context
    campaign_id UUID,
    partner_id UUID REFERENCES partners(id),
    ambassador_id UUID REFERENCES ambassadors(id),
    
    -- Sharing Tree
    level INTEGER NOT NULL,
    distribution_model VARCHAR(50),
    
    -- Fragrance Creation Flow
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
    
    -- Recipient (can be ambassador or partner)
    recipient_id UUID NOT NULL,
    recipient_type VARCHAR(50) NOT NULL,
    
    -- Commission Details
    level INTEGER NOT NULL,
    rate DECIMAL(5,4) NOT NULL,
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

-- Create Indexes
CREATE INDEX idx_ambassadors_email ON ambassadors(email);
CREATE INDEX idx_ambassadors_user_id ON ambassadors(user_id);
CREATE INDEX idx_partners_ambassador_id ON partners(ambassador_id);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_recipients_shared_by ON recipients(shared_by);
CREATE INDEX idx_recipients_ambassador_id ON recipients(ambassador_id);
CREATE INDEX idx_recipients_level ON recipients(level);
CREATE INDEX idx_purchases_recipient_id ON purchases(recipient_id);
CREATE INDEX idx_purchases_partner_id ON purchases(partner_id);
CREATE INDEX idx_purchases_level ON purchases(level);
CREATE INDEX idx_commissions_recipient_id ON commissions(recipient_id);
CREATE INDEX idx_commissions_purchase_id ON commissions(purchase_id);
CREATE INDEX idx_commissions_payout_period ON commissions(payout_period);

-- Enable Row Level Security
ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Ambassadors
CREATE POLICY "Ambassadors can view own data"
    ON ambassadors FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Ambassadors can update own data"
    ON ambassadors FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for Partners
CREATE POLICY "Ambassadors can view their partners"
    ON partners FOR SELECT
    USING (ambassador_id IN (
        SELECT id FROM ambassadors WHERE user_id = auth.uid()
    ));

CREATE POLICY "Partners can view own data"
    ON partners FOR SELECT
    USING (user_id = auth.uid());

-- RLS Policies for Commissions
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

-- Admin access (service role bypasses RLS)
```

### Step 2: Run Migration

```bash
# Initialize Supabase in project
cd "/Users/kentertugrul/Desktop/Scentwork Corporate"
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Create migration file
mkdir -p supabase/migrations
# Copy the SQL above into supabase/migrations/001_initial_schema.sql

# Run migration
supabase db push
```

Or run directly in Supabase Dashboard:
1. Go to your Supabase project → SQL Editor
2. Paste the migration SQL
3. Click "Run"

---

## Authentication Setup

### Step 1: Configure Auth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Email provider
3. Configure email templates (optional)

### Step 2: Create Auth Helper

Create `src/lib/supabase.ts`:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Client-side
export const createClient = () => createClientComponentClient();

// Server-side
export const createServerClient = () => createServerComponentClient({ cookies });
```

### Step 3: Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Add to `.gitignore`:
```
.env.local
.env*.local
```

---

## Frontend Integration

### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### Step 2: Create Supabase Service Layer

Create `src/services/ambassadorService.ts`:

```typescript
import { createClient } from '@/lib/supabase';

export const ambassadorService = {
  async getDashboard(ambassadorId: string) {
    const supabase = createClient();
    
    // Get ambassador data
    const { data: ambassador } = await supabase
      .from('ambassadors')
      .select('*')
      .eq('id', ambassadorId)
      .single();
    
    // Get partners
    const { data: partners } = await supabase
      .from('partners')
      .select('*')
      .eq('ambassador_id', ambassadorId);
    
    // Get commission stats
    const { data: commissions } = await supabase
      .from('commissions')
      .select('level, amount_cents')
      .eq('recipient_id', ambassadorId)
      .eq('recipient_type', 'ambassador');
    
    // Calculate totals
    const commissionByLevel = {
      level1: 0, level2: 0, level3: 0, level4: 0, level5: 0
    };
    
    commissions?.forEach(c => {
      commissionByLevel[`level${c.level}`] += c.amount_cents / 100;
    });
    
    return {
      ambassador,
      stats: {
        activePartners: partners?.filter(p => p.status === 'approved').length || 0,
        pendingPartners: partners?.filter(p => p.status !== 'approved').length || 0,
        totalCommission: Object.values(commissionByLevel).reduce((a, b) => a + b, 0)
      },
      commissionByLevel,
      partners
    };
  },
  
  async getPartners(ambassadorId: string) {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('partners')
      .select(`
        *,
        commissions:commissions(level, amount_cents, count)
      `)
      .eq('ambassador_id', ambassadorId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async submitPartner(ambassadorId: string, partnerData: any) {
    const supabase = createClient();
    
    // Insert partner
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .insert({
        ...partnerData,
        ambassador_id: ambassadorId,
        status: 'pending_review',
        partner_code: `PARTNER-${partnerData.name.substring(0, 4).toUpperCase()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`
      })
      .select()
      .single();
    
    if (partnerError) throw partnerError;
    
    // Add to approval queue
    const { error: queueError } = await supabase
      .from('approval_queue')
      .insert({
        partner_id: partner.id,
        company_name: partnerData.name,
        website: partnerData.website,
        status: 'pending_review'
      });
    
    if (queueError) throw queueError;
    
    return partner;
  }
};
```

### Step 3: Update Main Component

Update `src/ScentworkCorporateConsole.tsx`:

```typescript
"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { ambassadorService } from '@/services/ambassadorService';

export default function ScentworkCorporateConsole() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  
  useEffect(() => {
    loadDashboard();
  }, []);
  
  async function loadDashboard() {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUser(user);
    
    // Get ambassador by user_id
    const { data: ambassador } = await supabase
      .from('ambassadors')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (ambassador) {
      const data = await ambassadorService.getDashboard(ambassador.id);
      setDashboardData(data);
    }
    
    setLoading(false);
  }
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <LoginPage />;
  
  // Rest of component...
}
```

---

## API Functions

### Commission Calculation Function

Create `supabase/functions/calculate-commission/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  const { purchaseId } = await req.json();
  
  // Get purchase
  const { data: purchase } = await supabase
    .from('purchases')
    .select('*, recipient:recipients(*)')
    .eq('id', purchaseId)
    .single();
  
  if (!purchase) {
    return new Response(JSON.stringify({ error: 'Purchase not found' }), {
      status: 404
    });
  }
  
  // Calculate commissions
  const commissions = [];
  const rates = {
    1: 0.10,   // 10%
    2: 0.075,  // 7.5%
    3: 0.025,  // 2.5%
    4: 0.025,  // 2.5%
    5: 0.025   // 2.5%
  };
  
  // Level 1 - Ambassador
  if (purchase.ambassador_id) {
    commissions.push({
      purchase_id: purchaseId,
      recipient_id: purchase.ambassador_id,
      recipient_type: 'ambassador',
      level: 1,
      rate: rates[1],
      amount_cents: Math.round(purchase.amount_cents * rates[1]),
      purchase_amount_cents: purchase.amount_cents,
      status: 'pending'
    });
  }
  
  // Level 1 - Partner (if Pass-Through)
  if (purchase.distribution_model === 'pass_through' && purchase.partner_id) {
    commissions.push({
      purchase_id: purchaseId,
      recipient_id: purchase.partner_id,
      recipient_type: 'partner',
      level: 1,
      rate: rates[1],
      amount_cents: Math.round(purchase.amount_cents * rates[1]),
      purchase_amount_cents: purchase.amount_cents,
      status: 'pending'
    });
  }
  
  // Levels 2-5 - Traverse sharing tree
  let currentRecipient = purchase.recipient;
  let currentLevel = 2;
  
  while (currentRecipient?.shared_by && currentLevel <= 5) {
    const { data: parentRecipient } = await supabase
      .from('recipients')
      .select('*, ambassador:ambassadors(id), partner:partners(id)')
      .eq('id', currentRecipient.shared_by)
      .single();
    
    if (parentRecipient) {
      // Add commission for ambassador
      if (parentRecipient.ambassador_id) {
        commissions.push({
          purchase_id: purchaseId,
          recipient_id: parentRecipient.ambassador_id,
          recipient_type: 'ambassador',
          level: currentLevel,
          rate: rates[currentLevel],
          amount_cents: Math.round(purchase.amount_cents * rates[currentLevel]),
          purchase_amount_cents: purchase.amount_cents,
          status: 'pending'
        });
      }
      
      currentRecipient = parentRecipient;
      currentLevel++;
    } else {
      break;
    }
  }
  
  // Insert commissions
  const { error } = await supabase
    .from('commissions')
    .insert(commissions);
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }
  
  return new Response(JSON.stringify({ 
    success: true,
    commissions: commissions.length 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

Deploy function:
```bash
supabase functions deploy calculate-commission
```

---

## Real-time Subscriptions

Add real-time updates to dashboard:

```typescript
useEffect(() => {
  const supabase = createClient();
  
  // Subscribe to commission updates
  const channel = supabase
    .channel('commissions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'commissions',
        filter: `recipient_id=eq.${ambassadorId}`
      },
      (payload) => {
        console.log('Commission update:', payload);
        loadDashboard(); // Refresh data
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [ambassadorId]);
```

---

## Complete Integration Checklist

### Setup (Day 1)
- [ ] Create Supabase project
- [ ] Copy project credentials
- [ ] Install Supabase dependencies
- [ ] Create environment variables
- [ ] Run database migration

### Backend (Week 1)
- [ ] Create all database tables
- [ ] Set up Row Level Security policies
- [ ] Create service layer functions
- [ ] Deploy Edge Functions for commission calculation
- [ ] Test database queries

### Frontend (Week 2)
- [ ] Replace mock data with Supabase queries
- [ ] Add authentication flow
- [ ] Implement real-time subscriptions
- [ ] Add loading states
- [ ] Add error handling

### Testing (Week 3)
- [ ] Test authentication
- [ ] Test commission calculations
- [ ] Test real-time updates
- [ ] Test RLS policies
- [ ] Performance testing

---

## Quick Start Commands

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize in project
cd "/Users/kentertugrul/Desktop/Scentwork Corporate"
supabase init

# Link to project
supabase link --project-ref YOUR_PROJECT_REF

# Start local development
supabase start

# Run migrations
supabase db push

# Deploy functions
supabase functions deploy calculate-commission
```

---

## Environment Variables

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop"
  }
}
```

---

## Next Steps

1. **Create Supabase Project** (5 minutes)
2. **Run Database Migration** (10 minutes)
3. **Set up Authentication** (15 minutes)
4. **Install Dependencies** (5 minutes)
5. **Create Service Layer** (2-3 hours)
6. **Update Frontend** (4-6 hours)
7. **Deploy Edge Functions** (1-2 hours)
8. **Test Everything** (2-4 hours)

**Total Estimated Time:** 1-2 days for basic integration

---

## Resources

- **Supabase Docs:** https://supabase.com/docs
- **Auth Helpers:** https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- **Edge Functions:** https://supabase.com/docs/guides/functions
- **Real-time:** https://supabase.com/docs/guides/realtime

---

**Support:** Need help? Check Supabase Discord or documentation.

