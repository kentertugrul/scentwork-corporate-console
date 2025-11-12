# Developer Integration Guide - Scentwork Corporate Console

**Version:** 1.0  
**Last Updated:** November 2024  
**Purpose:** Technical guide for integrating the Scentwork Corporate Console with production backend systems

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [API Integration Points](#api-integration-points)
4. [Database Schema](#database-schema)
5. [Data Flow](#data-flow)
6. [Input/Output Specifications](#inputoutput-specifications)
7. [Commission Calculation Logic](#commission-calculation-logic)
8. [Implementation Checklist](#implementation-checklist)

---

## Overview

This guide explains how to integrate the Scentwork Corporate Console frontend (Next.js/React) with your production backend system. The console currently uses mock data and needs to be connected to:

- Authentication system
- Database (PostgreSQL/MySQL)
- API endpoints
- Commission calculation engine
- Payment processing system

---

## System Architecture

### Current State (Prototype)

```
Frontend (Next.js/React)
    ↓
Mock Data (Hardcoded)
    ↓
No Backend Connection
```

### Target State (Production)

```
Frontend (Next.js/React)
    ↓
API Client Layer (React Query/SWR)
    ↓
REST API / GraphQL
    ↓
Backend Services
    ├── Authentication Service
    ├── Ambassador Service
    ├── Partner Service
    ├── Commission Engine
    └── Payment Service
    ↓
Database (PostgreSQL)
```

---

## API Integration Points

### 1. Authentication Endpoints

**Base URL:** `/api/auth`

#### Login
```
POST /api/auth/login
Request Body:
{
  "email": "sarah@scentwork.ai",
  "password": "secure_password"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "ambassador_001",
    "name": "Sarah Thompson",
    "email": "sarah@scentwork.ai",
    "role": "ambassador",
    "tier": "Tier B",
    "qualificationStatus": "qualified"
  }
}
```

#### Get Current User
```
GET /api/auth/me
Headers: { "Authorization": "Bearer jwt_token" }

Response:
{
  "id": "ambassador_001",
  "name": "Sarah Thompson",
  "email": "sarah@scentwork.ai",
  "role": "ambassador",
  "tier": "Tier B",
  "qualificationStatus": "qualified",
  "kycComplete": true
}
```

### 2. Ambassador Endpoints

**Base URL:** `/api/ambassadors`

#### Get Ambassador Dashboard Data
```
GET /api/ambassadors/{id}/dashboard
Headers: { "Authorization": "Bearer jwt_token" }

Response:
{
  "ambassador": {
    "id": "ambassador_001",
    "name": "Sarah Thompson",
    "email": "sarah@scentwork.ai",
    "tier": "Tier B",
    "qualificationStatus": "qualified"
  },
  "stats": {
    "activePartners": 2,
    "pendingPartners": 1,
    "totalPurchases": 142,
    "totalCommission": 2285
  },
  "commissionByLevel": {
    "level1": 1950,
    "level2": 240,
    "level3": 45,
    "level4": 30,
    "level5": 20
  }
}
```

#### Get Ambassador's Partners
```
GET /api/ambassadors/{id}/partners
Headers: { "Authorization": "Bearer jwt_token" }
Query Params: ?status=approved&page=1&limit=20

Response:
{
  "partners": [
    {
      "id": "partner_001",
      "name": "Acme Hotels",
      "website": "https://acmehotels.example",
      "contact": {
        "name": "James Carter",
        "email": "j.carter@acmehotels.example",
        "title": "VP Loyalty"
      },
      "region": "US",
      "distributionModel": "pass_through",
      "status": "approved",
      "partnerCode": "PARTNER-ACME-8F29",
      "createdAt": "2025-10-03",
      "lastActivity": "2025-11-01",
      "commissionByLevel": {
        "level1": { "count": 45, "revenue": 4500, "commission": 450 },
        "level2": { "count": 32, "revenue": 3200, "commission": 240 },
        "level3": { "count": 18, "revenue": 1800, "commission": 45 },
        "level4": { "count": 12, "revenue": 1200, "commission": 30 },
        "level5": { "count": 8, "revenue": 800, "commission": 20 }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

#### Submit Partner Introduction
```
POST /api/ambassadors/{id}/partners
Headers: { "Authorization": "Bearer jwt_token" }

Request Body:
{
  "companyName": "NewCo",
  "website": "https://newco.example",
  "hqCountry": "USA",
  "industry": "Technology",
  "employeeCount": 5000,
  "contactName": "John Doe",
  "contactEmail": "john@newco.example",
  "contactPhone": "+1 212 555 0101",
  "preferredModel": "pass_through",
  "estimatedAudience": "100k customers",
  "notes": "Potential enterprise client"
}

Response:
{
  "id": "partner_003",
  "status": "pending_review",
  "message": "Partner application submitted for admin review"
}
```

### 3. Partner Endpoints

**Base URL:** `/api/partners`

#### Get Partner Dashboard
```
GET /api/partners/{id}/dashboard
Headers: { "Authorization": "Bearer jwt_token" }

Response:
{
  "partner": {
    "id": "partner_001",
    "name": "Acme Hotels",
    "partnerCode": "PARTNER-ACME-8F29",
    "distributionModel": "pass_through",
    "status": "approved"
  },
  "campaigns": [...],
  "shareLinks": [
    {
      "id": "link_001",
      "url": "https://scent.work/l/acme-q4",
      "campaign": "Q4 Loyalty",
      "clicks": 1250,
      "conversions": 200
    }
  ],
  "commissionByLevel": {
    "level1": { "count": 45, "revenue": 4500, "commission": 450 },
    "level2": { "count": 32, "revenue": 3200, "commission": 240 },
    "level3": { "count": 18, "revenue": 1800, "commission": 45 },
    "level4": { "count": 12, "revenue": 1200, "commission": 30 },
    "level5": { "count": 8, "revenue": 800, "commission": 20 }
  }
}
```

#### Partner Onboarding
```
POST /api/partners/onboard
Request Body:
{
  "inviteCode": "INVITE-ABC123",
  "companyLegalName": "Acme Hotels LLC",
  "website": "https://acmehotels.example",
  "billingAddress": "123 Main St, New York, NY 10001",
  "taxId": "US123456789",
  "distributionModel": "pass_through",
  "primaryContact": {
    "name": "James Carter",
    "title": "VP Loyalty",
    "email": "j.carter@acmehotels.example"
  }
}

Response:
{
  "id": "partner_001",
  "status": "pending_review",
  "message": "Application submitted for review"
}
```

### 4. Admin Endpoints

**Base URL:** `/api/admin`

#### Get Approval Queue
```
GET /api/admin/approval-queue
Headers: { "Authorization": "Bearer jwt_token" }
Query Params: ?status=pending&page=1&limit=20

Response:
{
  "applications": [
    {
      "id": "partner_003",
      "name": "VentureWorks",
      "website": "https://ventureworks.example",
      "contact": {
        "name": "Leo Park",
        "email": "leo@ventureworks.example",
        "title": "CMO"
      },
      "region": "US",
      "distributionModel": "pass_through",
      "introducedBy": {
        "id": "ambassador_001",
        "name": "Sarah Thompson",
        "qualificationStatus": "qualified"
      },
      "domain": "ventureworks.example",
      "riskScore": 0.12,
      "status": "pending_review",
      "submittedAt": "2025-11-01T10:30:00Z"
    }
  ],
  "pagination": {...}
}
```

#### Approve Partner
```
POST /api/admin/partners/{id}/approve
Headers: { "Authorization": "Bearer jwt_token" }

Request Body:
{
  "distributionModel": "pass_through",
  "commissionPool": 0.35,
  "dualTenPercent": true,
  "notes": "Approved after review"
}

Response:
{
  "id": "partner_003",
  "status": "approved",
  "partnerCode": "PARTNER-VENTURE-A1B2",
  "message": "Partner approved successfully"
}
```

### 5. Commission Endpoints

**Base URL:** `/api/commissions`

#### Calculate Commission
```
POST /api/commissions/calculate
Headers: { "Authorization": "Bearer jwt_token" }

Request Body:
{
  "purchaseId": "purchase_123",
  "amount": 100.00,
  "level": 1,
  "ambassadorId": "ambassador_001",
  "partnerId": "partner_001",
  "distributionModel": "pass_through"
}

Response:
{
  "purchaseId": "purchase_123",
  "amount": 100.00,
  "level": 1,
  "commissions": [
    {
      "recipientId": "ambassador_001",
      "recipientType": "ambassador",
      "rate": 0.10,
      "amount": 10.00
    },
    {
      "recipientId": "partner_001",
      "recipientType": "partner",
      "rate": 0.10,
      "amount": 10.00
    }
  ],
  "totalCommission": 20.00
}
```

#### Get Commission Statement
```
GET /api/commissions/statement
Headers: { "Authorization": "Bearer jwt_token" }
Query Params: ?month=2025-11&year=2025

Response:
{
  "period": "2025-11",
  "totalCommission": 2285.00,
  "byLevel": {
    "level1": 1950.00,
    "level2": 240.00,
    "level3": 45.00,
    "level4": 30.00,
    "level5": 20.00
  },
  "byPartner": [
    {
      "partnerId": "partner_001",
      "partnerName": "Acme Hotels",
      "commission": 785.00
    }
  ],
  "transactions": [...]
}
```

---

## Database Schema

### Pro Forma Database Structure

See `DATABASE_SCHEMA.md` for complete schema. Key tables:

1. **ambassadors** - Scentwork Ambassador accounts
2. **partners** - Scentwork Partner accounts
3. **campaigns** - Distribution campaigns
4. **purchases** - Product purchases
5. **commissions** - Commission records
6. **sharing_tree** - Network relationships (Levels 1-5)
7. **approval_queue** - Partner approval workflow

---

## Data Flow

### Purchase Flow (Pass-Through Model)

```
1. Customer clicks Partner's link
   ↓
2. Enters fragrance creation flow
   ↓
3. Customizes fragrance
   ↓
4. Completes checkout (integrated in flow)
   ↓
5. Purchase recorded in database
   ↓
6. Commission engine calculates:
   - Level 1: Ambassador (10%) + Partner (10%)
   - Levels 2-5: Based on sharing tree
   ↓
7. Commissions recorded
   ↓
8. Dashboard updated in real-time
```

### Purchase Flow (Bulk-Buy Model)

```
1. Partner purchases codes upfront
   ↓
2. Ambassador earns 10% immediately
   ↓
3. Partner distributes codes
   ↓
4. Recipients redeem codes
   ↓
5. When recipients share:
   - Levels 2-5 commissions calculated
   - Ambassador and Partner earn from shares
```

---

## Input/Output Specifications

### Inputs Required

#### From Frontend Forms

**Ambassador Application:**
- Full name, email, mobile, country
- Company (optional)
- Referral code (optional)
- Network size estimate
- Preferred distribution model
- Notes

**Partner Introduction:**
- Company name, website, HQ country
- Industry, employee count
- Primary contact (name, email, phone)
- Preferred distribution model
- Estimated audience
- Notes, logo/deck uploads

**Partner Onboarding:**
- Company legal name, website
- Billing address, Tax ID/VAT
- Distribution model selection
- Primary contact information
- Brand assets
- Terms agreement

#### From System Events

**Purchase Event:**
- Purchase ID
- Amount
- Customer ID
- Partner ID (if applicable)
- Ambassador ID (if applicable)
- Level in sharing tree
- Timestamp
- Distribution model

**Share Event:**
- Share ID
- From user ID
- To user ID
- Level
- Timestamp
- Link/code used

### Outputs Generated

**Dashboard Data:**
- Ambassador/Partner information
- Commission totals by level
- Partner listings
- Campaign statistics
- Share link analytics

**Commission Calculations:**
- Commission amount per recipient
- Level breakdown
- Total commission
- Payout schedule

---

## Commission Calculation Logic

### Level 1 Commission (Pass-Through Model)

```javascript
function calculateLevel1Commission(purchase, model) {
  if (model === 'pass_through') {
    return {
      ambassador: purchase.amount * 0.10,  // 10%
      partner: purchase.amount * 0.10,      // 10%
      total: purchase.amount * 0.20
    };
  }
  // Bulk-Buy: Ambassador already paid on bulk purchase
  return { ambassador: 0, partner: 0, total: 0 };
}
```

### Levels 2-5 Commission

```javascript
function calculateDeepLevelCommission(purchase, level) {
  const rates = {
    2: 0.075,  // 7.5%
    3: 0.025,  // 2.5%
    4: 0.025,  // 2.5%
    5: 0.025   // 2.5%
  };
  
  return purchase.amount * rates[level];
}
```

### Sharing Tree Traversal

```javascript
function findCommissionRecipients(purchase, sharingTree) {
  const recipients = [];
  let currentLevel = 1;
  let currentNode = purchase.customerId;
  
  while (currentLevel <= 5 && currentNode) {
    const parent = sharingTree.getParent(currentNode);
    if (parent) {
      recipients.push({
        id: parent.id,
        type: parent.type, // 'ambassador' or 'partner'
        level: currentLevel,
        commission: calculateCommission(purchase.amount, currentLevel)
      });
      currentNode = parent.id;
      currentLevel++;
    } else {
      break;
    }
  }
  
  return recipients;
}
```

---

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Create database schema (see DATABASE_SCHEMA.md)
- [ ] Set up migrations
- [ ] Create indexes for performance
- [ ] Set up database backups

### Phase 2: Authentication
- [ ] Implement JWT authentication
- [ ] Create login/logout endpoints
- [ ] Add session management
- [ ] Implement role-based access control

### Phase 3: Core APIs
- [ ] Ambassador endpoints
- [ ] Partner endpoints
- [ ] Admin endpoints
- [ ] Commission calculation endpoints

### Phase 4: Frontend Integration
- [ ] Replace mock data with API calls
- [ ] Add React Query/SWR for data fetching
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Add optimistic updates

### Phase 5: Commission Engine
- [ ] Implement sharing tree structure
- [ ] Build commission calculation logic
- [ ] Create commission recording system
- [ ] Set up payout processing

### Phase 6: Real-time Updates
- [ ] WebSocket/Socket.io integration
- [ ] Real-time dashboard updates
- [ ] Notification system
- [ ] Activity feed

### Phase 7: Testing
- [ ] Unit tests for commission logic
- [ ] Integration tests for APIs
- [ ] End-to-end tests
- [ ] Load testing

---

## Next Steps

1. Review `DATABASE_SCHEMA.md` for complete database structure
2. Set up development environment
3. Begin with authentication system
4. Implement core APIs one by one
5. Integrate frontend gradually
6. Test commission calculations thoroughly

---

**Questions?** Contact: dev-support@scentwork.ai



