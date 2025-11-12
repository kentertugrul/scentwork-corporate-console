"use client";

/* ========================================================
   SCENTWORK CORPORATE CONSOLE – MLM Knowledge Base Integration
   ========================================================
   
   This component implements the Scentwork Corporate Programme
   with Levels 1-5 payout structure, Tier A/B qualification,
   and Flavour 1 (Pass-Through) / Flavour 2 (Bulk-Buy) distribution.
   
   Key Terminology:
   - Scentwork Ambassador = Introducer (qualification is admin-controlled)
   - Scentwork Partner = Corporate Partner
   - Recipients = End users who receive and share codes (Levels 1-5)
   - Tier A = Standard Edition (Network Launch)
   - Tier B = Corporate Edition (Upgrade Tier - admin qualification required)
   ======================================================== */

import React, { useMemo, useState } from "react";
import {
  Check,
  CircleAlert,
  CircleSlash2,
  CircleDashed,
  ArrowLeft,
  QrCode,
  Plus,
  ExternalLink,
  Mail,
  Search,
  ClipboardList,
  Users,
  TrendingUp,
  Award,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

/* ====================================================================
   MOCK DATA (replace with real API calls later)
   ==================================================================== */

// Scentwork Ambassador data - qualification is admin-controlled
const MOCK_INTRODUCER = {
  id: "ambassador_001",
  name: "Sarah Thompson",
  email: "sarah@scentwork.ai",
  tier: "Tier B", // Tier A or Tier B
  status: "Qualified", // Admin-controlled qualification status
  kycComplete: true,
  qualificationMet: true, // Admin-approved qualification
};

// Sample corporates list for ambassador (Scentwork Partners)
const initialCorporates = [
  {
    id: "corp_001",
    name: "Acme Hotels",
    website: "https://acmehotels.example",
    contact: { name: "James Carter", email: "j.carter@acmehotels.example", title: "VP Loyalty" },
    region: "US",
    flavour: "Pass-Through Share", // Flavour 1
    status: "Approved",
    createdAt: "2025-10-03",
    lastActivity: "2025-11-01",
    partnerCode: "PARTNER-ACME-8F29",
    levels: {
      level1: { count: 45, revenue: 4500, commission: 450 }, // 10%
      level2: { count: 32, revenue: 3200, commission: 240 }, // 7.5%
      level3: { count: 18, revenue: 1800, commission: 45 }, // 2.5%
      level4: { count: 12, revenue: 1200, commission: 30 }, // 2.5%
      level5: { count: 8, revenue: 800, commission: 20 }, // 2.5%
    },
  },
  {
    id: "corp_002",
    name: "Globotel Group",
    website: "https://globotel.example",
    contact: { name: "Amira Diaz", email: "amira@globotel.example", title: "Head of HR" },
    region: "EU",
    flavour: "Bulk-Buy Gift", // Flavour 2
    status: "Pending Review",
    createdAt: "2025-10-28",
    lastActivity: "2025-10-29",
    bulkPurchaseValue: 15000, // Corporate purchased codes upfront
    levels: {
      level1: { count: 0, revenue: 0, commission: 1500 }, // 10% of bulk purchase
      level2: { count: 0, revenue: 0, commission: 0 },
      level3: { count: 0, revenue: 0, commission: 0 },
      level4: { count: 0, revenue: 0, commission: 0 },
      level5: { count: 0, revenue: 0, commission: 0 },
    },
  },
];

// Approval queue seed (admin view)
const approvalQueueSeed = [
  {
    id: "corp_003",
    name: "VentureWorks",
    website: "https://ventureworks.example",
    contact: { name: "Leo Park", email: "leo@ventureworks.example", title: "CMO" },
    region: "US",
    flavour: "Pass-Through Share",
    introducedBy: "Sarah Thompson",
    domain: "ventureworks.example",
    risk: 0.12,
    status: "Awaiting Admin",
  },
];

/* ====================================================================
   Utility Components
   ==================================================================== */

// StatusPill shows different colours based on status
const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    Approved: "bg-green-100 text-green-800",
    "Pending Review": "bg-amber-100 text-amber-800",
    "Awaiting Admin": "bg-amber-100 text-amber-800",
    "Changes Requested": "bg-blue-100 text-blue-800",
    Rejected: "bg-zinc-200 text-zinc-700",
    Paused: "bg-zinc-100 text-zinc-700",
    Qualified: "bg-green-100 text-green-800",
    "Tier A": "bg-blue-100 text-blue-800",
    "Tier B": "bg-purple-100 text-purple-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${map[status] || "bg-zinc-100 text-zinc-700"}`}>
      {status}
    </span>
  );
};

// Empty state UI component
function EmptyState({ icon: Icon, title, subtitle, cta, onClick }: any) {
  return (
    <Card className="border-dashed">
      <CardHeader className="items-center">
        <div className="rounded-2xl p-3 bg-zinc-50"><Icon className="h-6 w-6" /></div>
        <CardTitle className="text-xl mt-2">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardFooter className="justify-center pb-6">
        {cta && <Button onClick={onClick}>{cta}</Button>}
      </CardFooter>
    </Card>
  );
}

// Info: label/value pair
function Info({ label, value }: any) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

// KPI tile for dashboard
function KPI({ title, value, icon: Icon }: any) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-zinc-500" />}
          <CardDescription>{title}</CardDescription>
        </div>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

// Levels 1-5 Commission Display
function CommissionLevels({ levels }: any) {
  const levelStructure = [
    { level: 1, label: "Level 1 (Direct)", percentage: "10%", data: levels?.level1 },
    { level: 2, label: "Level 2", percentage: "7.5%", data: levels?.level2 },
    { level: 3, label: "Level 3", percentage: "2.5%", data: levels?.level3 },
    { level: 4, label: "Level 4", percentage: "2.5%", data: levels?.level4 },
    { level: 5, label: "Level 5", percentage: "2.5%", data: levels?.level5 },
  ];

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium mb-3">Payout Structure (Levels 1-5)</div>
      {levelStructure.map(({ level, label, percentage, data }) => (
        <div key={level} className="flex items-center justify-between p-2 rounded border border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium">
              L{level}
            </div>
            <div>
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-zinc-500">{percentage} commission</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">${data?.commission?.toLocaleString() || "0"}</div>
            <div className="text-xs text-zinc-500">{data?.count || 0} purchases</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ====================================================================
   Public: Scentwork Ambassador Application Form
   ==================================================================== */

function IntroducerApplication({ onSubmitted }: { onSubmitted: () => void }) {
  const [step, setStep] = useState(1);
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Become a Scentwork Ambassador</CardTitle>
          <CardDescription className="space-y-2">
            <p>
              As a Scentwork Ambassador, you'll build your network and earn commissions through our Levels 1-5 payout structure. 
              Start with Tier A (Standard Edition) and grow your network to unlock Tier B (Corporate Edition).
            </p>
            <p className="text-sm text-zinc-600">
              <strong>How it works:</strong> Share your unique codes and links. When people purchase or share, you earn commissions 
              up to 5 levels deep. Once you've built a strong network in Tier A, you can apply for Tier B qualification to introduce corporate partners.
            </p>
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-6 pt-6">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input placeholder="Your name" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" />
              </div>
              <div>
                <Label>Mobile</Label>
                <Input placeholder="+34 600 000 000" />
              </div>
              <div>
                <Label>Country</Label>
                <Input placeholder="Spain" />
              </div>
              <div className="md:col-span-2">
                <Label>Company (optional)</Label>
                <Input placeholder="Company name" />
              </div>
              <div className="md:col-span-2">
                <Label>Referral Code (optional)</Label>
                <Input placeholder="If someone invited you" />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Switch id="nda" defaultChecked />
                <Label htmlFor="nda">I agree to NDA & Terms</Label>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900 mb-2">Your Path to Tier B</div>
                <div className="text-sm text-blue-700 space-y-2">
                  <p>
                    To unlock Tier B (Corporate Edition) and introduce Scentwork Partners, you need to build a strong, 
                    engaged network in Tier A. Qualification is determined through admin review based on network quality, 
                    engagement, and compliance.
                  </p>
                  <p>
                    <strong>What we look for:</strong> A demonstrated track record of building an engaged network, driving 
                    purchases and sharing, maintaining compliance, and showing commitment to the program. Network quality 
                    matters more than just numbers.
                  </p>
                  <p>
                    Once qualified by admin review, you can introduce corporate partners (Scentwork Partners) who can choose 
                    between two distribution models: Pass-Through Share or Bulk-Buy Gift.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Corporate Network Size (estimated)</Label>
                  <Select defaultValue="50-250">
                    <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<10">&lt;10</SelectItem>
                      <SelectItem value="10-50">10–50</SelectItem>
                      <SelectItem value="50-250">50–250</SelectItem>
                      <SelectItem value=">250">250+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preferred Distribution Model (when qualified)</Label>
                  <Select defaultValue="both">
                    <SelectTrigger><SelectValue placeholder="Choose model" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">Model 1: Pass-Through Share</SelectItem>
                      <SelectItem value="prepaid">Model 2: Bulk-Buy Gift</SelectItem>
                      <SelectItem value="both">Both Models</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-500 mt-1">Scentwork Partners will choose their preferred model during onboarding</p>
                </div>
                <div className="md:col-span-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Describe your network, verticals, examples of corporate contacts…" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep(1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {step === 1 ? (
            <Button onClick={() => setStep(2)}>Continue</Button>
          ) : (
            <Button onClick={onSubmitted}>
              <Check className="mr-2 h-4 w-4" /> Submit Application
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

/* ====================================================================
   Scentwork Ambassador Dashboard and related pages
   ==================================================================== */

function IntroducerDashboard({ corporates, onAddCorporate, onOpenCorporate }: any) {
  const totalCommission = useMemo(() => {
    return corporates.reduce((sum: number, corp: any) => {
      if (!corp.levels) return sum;
      return sum + (corp.levels.level1?.commission || 0) +
        (corp.levels.level2?.commission || 0) +
        (corp.levels.level3?.commission || 0) +
        (corp.levels.level4?.commission || 0) +
        (corp.levels.level5?.commission || 0);
    }, 0);
  }, [corporates]);

  return (
    <div className="space-y-6 p-6">
      {/* Header with welcome and qualification status */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-4">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Welcome, {MOCK_INTRODUCER.name}</CardTitle>
              <CardDescription className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <StatusPill status="Scentwork Ambassador" />
                  <StatusPill status={MOCK_INTRODUCER.tier} />
                  <StatusPill status={MOCK_INTRODUCER.status} />
                </div>
                <div className="mt-2 text-sm">
                  {MOCK_INTRODUCER.qualificationMet ? (
                    <span className="text-green-700">
                      ✓ Qualified for Tier B. You can now introduce Scentwork Partners!
                    </span>
                  ) : (
                    <span className="text-amber-700">
                      Tier A status. Continue building your network and maintaining engagement to be considered for Tier B qualification.
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-600 mt-2 p-2 bg-zinc-50 rounded">
                  <strong>Your role:</strong> As a Scentwork Ambassador, you introduce corporate partners (Scentwork Partners) 
                  and earn commissions from their campaigns. You earn 10% of Level 1 purchases, plus commissions from Levels 2-5 
                  as the sharing network grows.
                </div>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {MOCK_INTRODUCER.qualificationMet && (
                <Button variant="outline" onClick={onAddCorporate}>
                  <Plus className="mr-2 h-4 w-4" /> Add Scentwork Partner
                </Button>
              )}
              <Button><ExternalLink className="mr-2 h-4 w-4" /> Resources</Button>
            </div>
          </CardHeader>
        </Card>

        <KPI title="Active Scentwork Partners" value={corporates.filter((c: any) => c.status === "Approved").length} icon={Users} />
        <KPI title="Pending Approval" value={corporates.filter((c: any) => c.status !== "Approved").length} icon={CircleAlert} />
        <KPI title="Total Levels 1-5 Purchases" value={142} icon={TrendingUp} />
        <KPI title="Est. Total Commission" value={`$ ${Intl.NumberFormat().format(totalCommission)}`} icon={Award} />
      </div>

      {/* Levels 1-5 Commission Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Summary (Levels 1-5)</CardTitle>
          <CardDescription className="space-y-2">
            <p>
              Your earnings breakdown across all five commission levels. Each level represents one degree of separation 
              in the sharing tree—when someone you introduced shares with their network, you earn from those deeper levels too.
            </p>
            <p className="text-sm text-zinc-600">
              <strong>How Levels 1-5 work:</strong> Level 1 (10%) = direct purchases from your network. Levels 2-5 (7.5%, 2.5%, 2.5%, 2.5%) 
              = purchases from people who were shared with by your network. Sharing is always enabled, creating the "What are you wearing?" 
              moment that drives network growth.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((level) => {
              const percentage = level === 1 ? "10%" : level === 2 ? "7.5%" : "2.5%";
              const totalForLevel = corporates.reduce((sum: number, corp: any) => {
                return sum + (corp.levels?.[`level${level}`]?.commission || 0);
              }, 0);
              return (
                <div key={level} className="p-4 border rounded-lg">
                  <div className="text-xs text-zinc-500 mb-1">Level {level}</div>
                  <div className="text-lg font-semibold">{percentage}</div>
                  <div className="text-sm text-zinc-700 mt-2">${totalForLevel.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Table listing corporates */}
      <Card>
        <CardHeader>
          <CardTitle>My Scentwork Partners</CardTitle>
          <CardDescription>
            Track approvals and Levels 1-5 activity for each Scentwork Partner. These are corporate partners you've introduced 
            who can distribute Scentwork products to their employees, customers, or members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {corporates.length === 0 ? (
            <EmptyState 
              icon={CircleAlert} 
              title="No Scentwork Partners yet" 
              subtitle={MOCK_INTRODUCER.qualificationMet 
                ? "Add your first Scentwork Partner to get started with Tier B. Scentwork Partners are corporate clients who will distribute products to their audience."
                : "Continue building your network in Tier A. Once you're qualified for Tier B through admin review, you can introduce Scentwork Partners."
              } 
              cta={MOCK_INTRODUCER.qualificationMet ? "Add Scentwork Partner" : undefined} 
              onClick={onAddCorporate} 
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="py-2 pr-4">Scentwork Partner</th>
                    <th className="py-2 pr-4">Contact</th>
                    <th className="py-2 pr-4">Distribution Model</th>
                    <th className="py-2 pr-4">Region</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Levels 1-5 Total</th>
                    <th className="py-2 pr-4">Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {corporates.map((c: any) => {
                    const totalCommission = (c.levels?.level1?.commission || 0) +
                      (c.levels?.level2?.commission || 0) +
                      (c.levels?.level3?.commission || 0) +
                      (c.levels?.level4?.commission || 0) +
                      (c.levels?.level5?.commission || 0);
                    return (
                      <tr key={c.id} className="border-t">
                        <td className="py-2 pr-4 font-medium">{c.name}</td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{c.contact?.name}</span>
                          </div>
                          <div className="text-xs text-zinc-500">{c.contact?.email}</div>
                        </td>
                        <td className="py-2 pr-4">
                          <span className="text-xs">{c.flavour === "Pass-Through Share" ? "Model 1: Pass-Through" : "Model 2: Bulk-Buy"}</span>
                        </td>
                        <td className="py-2 pr-4">{c.region}</td>
                        <td className="py-2 pr-4"><StatusPill status={c.status} /></td>
                        <td className="py-2 pr-4 font-medium">${totalCommission.toLocaleString()}</td>
                        <td className="py-2 pr-4">{c.createdAt}</td>
                        <td className="py-2 pr-4 text-right">
                          <Button size="sm" variant="outline" onClick={() => onOpenCorporate(c)}>View</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Wizard for ambassador to add a Scentwork Partner
function AddCorporateWizard({ onCancel, onSubmit }: any) {
  const [step, setStep] = useState(1);
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Scentwork Partner</CardTitle>
          <CardDescription className="space-y-2">
            <p>
              Submit a corporate partner for approval as a Scentwork Partner. Once approved, they can choose their distribution model 
              and start distributing Scentwork products to their audience.
            </p>
            <p className="text-sm text-zinc-600">
              <strong>What is a Scentwork Partner?</strong> A corporate client (hotel, company, organization) that distributes 
              Scentwork products to employees, customers, or members. They choose between Pass-Through Share (no upfront purchase) 
              or Bulk-Buy Gift (purchase codes upfront). You earn commissions from their campaigns through the Levels 1-5 structure.
            </p>
          </CardDescription>
        </CardHeader>
        <Separator />

        <CardContent className="space-y-6 pt-6">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input placeholder="Acme Hotels" />
              </div>
              <div>
                <Label>Website</Label>
                <Input placeholder="https://acme.example" />
              </div>
              <div>
                <Label>HQ Country</Label>
                <Input placeholder="USA" />
              </div>
              <div>
                <Label>Industry</Label>
                <Input placeholder="Hospitality" />
              </div>
              <div>
                <Label>Employee Count</Label>
                <Input placeholder="5000" />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Primary Contact Name</Label>
                <Input placeholder="James Carter" />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input placeholder="j.carter@acme.example" />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input placeholder="+1 212 555 0101" />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm font-medium text-purple-900 mb-2">Distribution Models for Scentwork Partners</div>
                <div className="text-sm text-purple-700 space-y-3">
                  <div>
                    <strong>Model 1 – Pass-Through Share:</strong> The Scentwork Partner distributes links/codes to their audience 
                    without purchasing upfront. Recipients click the link and enter the fragrance creation flow, where they customize 
                    their fragrance. The checkout experience is built directly into this flow—customers complete their purchase as 
                    part of the fragrance creation experience. Both you (as the Ambassador) and the Partner earn 10% of Level 1 
                    purchases from their audience. Then Levels 2-5 commissions apply as sharing continues. This model works well for 
                    partners who want to test or have variable audience sizes.
                  </div>
                  <div>
                    <strong>Model 2 – Bulk-Buy Gift:</strong> The Scentwork Partner purchases codes/gift sets upfront to gift to 
                    employees or customers. You (as the Ambassador) earn 10% of their bulk purchase value immediately. When recipients 
                    share their codes, Levels 2-5 commissions apply to downstream purchases. This model works well for partners with 
                    fixed budgets or gifting programs.
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Preferred Distribution Model</Label>
                  <Select defaultValue="pass">
                    <SelectTrigger>
                      <SelectValue placeholder="Choose model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">Model 1: Pass-Through Share</SelectItem>
                      <SelectItem value="prepaid">Model 2: Bulk-Buy Gift</SelectItem>
                      <SelectItem value="both">Both (Partner Chooses)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-500 mt-1">The Partner will confirm their choice during onboarding</p>
                </div>
                <div>
                  <Label>Estimated Audience</Label>
                  <Input placeholder="100k customers / 8k employees" />
                </div>
                <div className="md:col-span-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Context, timing, brand notes, sharing strategy…" />
                </div>
                <div className="md:col-span-2">
                  <Label>Logo / Deck</Label>
                  <div className="flex gap-2 items-center">
                    <Button variant="outline">Upload</Button>
                    <span className="text-xs text-zinc-500">PDF/PNG/SVG</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-between">
          <Button variant="ghost" onClick={onCancel}><CircleSlash2 className="mr-2 h-4 w-4" /> Cancel</Button>
          <div className="flex gap-2">
            <Button variant="outline" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</Button>
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>Next</Button>
            ) : (
              <Button onClick={onSubmit}><Check className="mr-2 h-4 w-4" /> Submit</Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Ambassador view: Scentwork Partner detail with Levels 1-5 breakdown
function CorporateDetail({ corporate, onBack }: any) {
  if (!corporate) return null;

  return (
    <div className="p-6 space-y-4">
      <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{corporate.name}</CardTitle>
              <CardDescription className="space-y-1">
                <div>{corporate.website}</div>
                <div className="text-xs text-zinc-500">Scentwork Partner</div>
              </CardDescription>
            </div>
            <StatusPill status={corporate.status} />
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Info label="Distribution Model" value={corporate.flavour} />
          <Info label="Region" value={corporate.region} />
          <Info label="Partner Code" value={corporate.partnerCode || corporate.qr2Code || "–"} />
          <Info label="Primary Contact" value={`${corporate.contact?.name} — ${corporate.contact?.title}`} />
          <Info label="Email" value={corporate.contact?.email} />
          <Info label="Created" value={corporate.createdAt} />
        </CardContent>
        <Separator />
        <CardContent>
          <CommissionLevels levels={corporate.levels} />
        </CardContent>
        <CardFooter className="gap-2">
          <Button variant="outline"><ClipboardList className="mr-2 h-4 w-4" /> Copy Invite Link</Button>
          <Button variant="outline"><Mail className="mr-2 h-4 w-4" /> Resend Invite</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/* ====================================================================
   Scentwork Partner – Onboarding Portal + Dashboard
   ==================================================================== */

function CorporateOnboardingPortal({ onSubmitted }: any) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Become a Scentwork Partner</CardTitle>
          <CardDescription className="space-y-2">
            <p>You've been invited by {MOCK_INTRODUCER.name}, a Scentwork Ambassador.</p>
            <p className="text-sm text-zinc-600">
              As a Scentwork Partner, you'll distribute Scentwork products to your audience (employees, customers, members) 
              and earn commissions through our Levels 1-5 payout structure. Choose the distribution model that works best for your organization.
            </p>
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-3">Choose Your Distribution Model</div>
            <div className="text-sm text-blue-700 space-y-3">
              <div>
                <strong>Model 1 – Pass-Through Share:</strong> Distribute links/codes to your audience without purchasing upfront. 
                When recipients click your link, they enter the fragrance creation flow where they customize their fragrance. The 
                checkout experience is built directly into this flow—customers complete their purchase seamlessly as part of the 
                creation experience. Both you (as the Partner) and your Ambassador earn 10% of Level 1 purchases from your audience. 
                Then Levels 2-5 commissions apply as sharing continues. <em>Best for: Testing, variable audience sizes, pay-as-you-go.</em>
              </div>
              <div>
                <strong>Model 2 – Bulk-Buy Gift:</strong> Purchase codes/gift sets upfront to gift to employees or customers. 
                Your Ambassador earns 10% of your purchase value immediately. When recipients share their codes, Levels 2-5 
                commissions apply to downstream purchases. <em>Best for: Fixed budgets, gifting programs, employee rewards.</em>
              </div>
              <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
                <strong>Note:</strong> Sharing is always enabled in both models. When recipients share their unique codes, 
                you and your Ambassador can earn from Levels 2-5 as the network grows—creating the "What are you wearing?" moment.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Company Legal Name</Label>
              <Input placeholder="Acme Hotels LLC" />
            </div>
            <div>
              <Label>Website</Label>
              <Input placeholder="https://acmehotels.example" />
            </div>
            <div>
              <Label>Billing Address</Label>
              <Input placeholder="Street, City, Country" />
            </div>
            <div>
              <Label>Tax ID / VAT</Label>
              <Input placeholder="EU123456789" />
            </div>
            <div>
              <Label>Distribution Model</Label>
              <Select defaultValue="pass">
                <SelectTrigger><SelectValue placeholder="Choose your model" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">Model 1: Pass-Through Share</SelectItem>
                  <SelectItem value="prepaid">Model 2: Bulk-Buy Gift</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-500 mt-1">You can change this later if needed</p>
            </div>
            <div>
              <Label>Primary Contact</Label>
              <Input placeholder="Name, Title" />
            </div>
            <div className="md:col-span-2">
              <Label>Brand Assets</Label>
              <div className="flex gap-2 items-center">
                <Button variant="outline">Upload</Button>
                <span className="text-xs text-zinc-500">Logo, colors, label preferences (Note: Tier B launched without custom branding initially)</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Agreements</Label>
              <div className="flex items-center gap-2">
                <Switch id="agree" defaultChecked />
                <Label htmlFor="agree">I agree to Scentwork Corporate Terms and understand the Levels 1-5 payout structure</Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onSubmitted}><Check className="mr-2 h-4 w-4" /> Submit for Review</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function CorporateDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Partner Code</CardTitle>
            <CardDescription>
              Your unique code for tracking and distribution. Use this on printed materials, emails, or any marketing materials 
              to track which campaigns drive the most engagement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-zinc-50 h-32 flex items-center justify-center text-zinc-500">
              <QrCode className="h-10 w-10" />
            </div>
          </CardContent>
          <CardFooter><Button variant="outline">Export PNG</Button></CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Campaign</CardTitle>
            <CardDescription>
              Launch a new distribution campaign. Choose your model and set a campaign name to track performance across Levels 1-5.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select>
              <SelectTrigger><SelectValue placeholder="Select distribution model"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="pass">Model 1: Pass-Through Share</SelectItem>
                <SelectItem value="prepaid">Model 2: Bulk-Buy Gift</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Campaign name (e.g., Q4 Loyalty)" />
          </CardContent>
          <CardFooter><Button><Plus className="mr-2 h-4 w-4" /> Create</Button></CardFooter>
        </Card>

        <Card>
          <CardHeader><CardTitle>Levels 1-5 Analytics</CardTitle><CardDescription>Redemptions & commission tracking</CardDescription></CardHeader>
          <CardContent><div className="h-32 rounded-xl bg-zinc-50 grid place-items-center text-zinc-500">Chart</div></CardContent>
          <CardFooter><Button variant="outline">View Report</Button></CardFooter>
        </Card>
      </div>

        <Card>
          <CardHeader>
            <CardTitle>Share Links</CardTitle>
            <CardDescription className="space-y-2">
              <p>
                UTM-ready links for email, SMS, social media, or any channel. Each link is trackable and helps you measure 
                campaign performance.
              </p>
              <p className="text-sm text-zinc-600">
                <strong>Why sharing matters:</strong> Sharing is always enabled. When your audience shares their unique links, 
                you and your Ambassador can earn commissions from Levels 2-5 as the network grows. This creates the "What are you wearing?" 
                moment—natural word-of-mouth that drives both engagement and earnings.
              </p>
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Input readOnly value="https://scent.work/l/acme-q4" />
            <Button variant="outline">Copy</Button>
          </div>
          <div className="flex items-center gap-2">
            <Input readOnly value="https://scent.work/l/acme-staff" />
            <Button variant="outline">Copy</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ====================================================================
   ADMIN – Approval Queue
   ==================================================================== */

function AdminApprovalQueue({ queue, onApprove }: any) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => queue.filter((q: any) => q.name.toLowerCase().includes(query.toLowerCase())), [queue, query]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Search corporates" value={query} onChange={(e) => setQuery(e.target.value)} className="w-80" />
        <Button variant="outline"><Search className="h-4 w-4 mr-2" /> Search</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval Queue</CardTitle>
          <CardDescription className="space-y-2">
            <p>
              Review and approve Scentwork Partner applications. Verify the introducing Scentwork Ambassador's qualification 
              status before approving.
            </p>
            <p className="text-sm text-zinc-600">
              <strong>Approval process:</strong> Verify the corporate information, confirm the Ambassador's qualification status 
              (admin-controlled), assign the distribution model, and confirm the Levels 1-5 payout structure is understood.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState icon={CircleDashed} title="No pending submissions" subtitle="New corporate introductions will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="py-2 pr-4">Scentwork Partner</th>
                    <th className="py-2 pr-4">Scentwork Ambassador</th>
                    <th className="py-2 pr-4">Domain</th>
                    <th className="py-2 pr-4">Region</th>
                    <th className="py-2 pr-4">Distribution Model</th>
                    <th className="py-2 pr-4">Risk</th>
                    <th className="py-2 pr-4">Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r: any) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 pr-4 font-medium">{r.name}</td>
                      <td className="py-2 pr-4">{r.introducedBy}</td>
                      <td className="py-2 pr-4">{r.domain}</td>
                      <td className="py-2 pr-4">{r.region}</td>
                      <td className="py-2 pr-4">{r.flavour === "Pass-Through Share" ? "Model 1: Pass-Through" : "Model 2: Bulk-Buy"}</td>
                      <td className="py-2 pr-4">{(r.risk * 100).toFixed(0)}%</td>
                      <td className="py-2 pr-4"><StatusPill status={r.status} /></td>
                      <td className="py-2 pr-4 text-right">
                        <Dialog>
                          <DialogTrigger asChild><Button size="sm" variant="outline">Review</Button></DialogTrigger>
                          <DialogContent className="sm:max-w-[520px]">
                            <DialogHeader>
                              <DialogTitle>Approve {r.name} as Scentwork Partner?</DialogTitle>
                              <DialogDescription>
                                Assign distribution model and confirm Levels 1-5 payout structure. Verify the introducing 
                                Ambassador's qualification status has been approved by admin.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                              <div>
                                <Label>Distribution Model</Label>
                                <Select defaultValue={r.flavour === "Bulk-Buy Gift" ? "prepaid" : "pass"}>
                                  <SelectTrigger><SelectValue placeholder="Choose model" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="prepaid">Model 2: Bulk-Buy Gift</SelectItem>
                                    <SelectItem value="pass">Model 1: Pass-Through Share</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="p-3 bg-zinc-50 rounded text-xs space-y-2">
                                <div><strong>Levels 1-5 Payout Structure:</strong></div>
                                <div>Level 1: 10% | Level 2: 7.5% | Levels 3-5: 2.5% each</div>
                                <div className="text-zinc-600 mt-2">
                                  {r.flavour === "Pass-Through Share" 
                                    ? "Both the Ambassador and Partner earn 10% of Level 1 purchases, then Levels 2-5 apply as sharing continues."
                                    : "The Ambassador earns 10% of bulk purchase value immediately, then Levels 2-5 apply to downstream shares."
                                  }
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch id="dual10" defaultChecked />
                                <Label htmlFor="dual10">Dual 10% on Model 1 (Pass-Through) Level 1 purchases</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={() => onApprove(r)}>Approve</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ====================================================================
   APP SHELL (demo router)                                                  
   ==================================================================== */

export default function ScentworkCorporateConsole() {
  const [route, setRoute] = useState<
    | "apply"
    | "intro_dashboard"
    | "intro_add"
    | "intro_corp_detail"
    | "corp_invite"
    | "corp_dashboard"
    | "admin_queue"
  >("intro_dashboard");

  const [corps, setCorps] = useState(initialCorporates);
  const [selected, setSelected] = useState<any>(initialCorporates[0]);
  const [queue, setQueue] = useState(approvalQueueSeed);

  const NavButton = ({ label, r }: { label: string; r: any }) => (
    <Button variant={route === r ? "default" : "ghost"} onClick={() => setRoute(r)}>{label}</Button>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b sticky top-0 z-10 bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          <span className="font-semibold">Scentwork Corporate Console</span>
          <div className="ml-auto flex gap-1">
            <NavButton label="Ambassador Dashboard" r="intro_dashboard" />
            <NavButton label="Add Partner" r="intro_add" />
            <NavButton label="Partner Signup" r="corp_invite" />
            <NavButton label="Partner Dashboard" r="corp_dashboard" />
            <NavButton label="Admin Queue" r="admin_queue" />
            <NavButton label="Apply (Public)" r="apply" />
          </div>
        </div>
      </div>

      {route === "apply" && <IntroducerApplication onSubmitted={() => setRoute("intro_dashboard")} />}
      {route === "intro_dashboard" && (
        <IntroducerDashboard
          corporates={corps}
          onAddCorporate={() => setRoute("intro_add")}
          onOpenCorporate={(c: any) => {
            setSelected(c);
            setRoute("intro_corp_detail");
          }}
        />
      )}
      {route === "intro_add" && (
        <AddCorporateWizard
          onCancel={() => setRoute("intro_dashboard")}
          onSubmit={() => {
            setQueue([
              ...queue,
              {
                id: `corp_${Math.random().toString(36).slice(2, 6)}`,
                name: "NewCo",
                website: "https://newco.example",
                contact: { name: "TBD", email: "tbd@newco.example", title: "TBD" },
                region: "US",
                flavour: "Pass-Through Share",
                introducedBy: MOCK_INTRODUCER.name,
                domain: "newco.example",
                risk: 0.07,
                status: "Awaiting Admin",
              },
            ]);
            setRoute("intro_dashboard");
          }}
        />
      )}
      {route === "intro_corp_detail" && <CorporateDetail corporate={selected} onBack={() => setRoute("intro_dashboard")} />}
      {route === "corp_invite" && <CorporateOnboardingPortal onSubmitted={() => setRoute("admin_queue")} />}
      {route === "corp_dashboard" && <CorporateDashboard />}
      {route === "admin_queue" && (
        <AdminApprovalQueue
          queue={queue}
          onApprove={(r: any) => {
            setCorps((prev) => [
              ...prev,
              {
                id: r.id,
                name: r.name,
                website: r.website,
                contact: r.contact,
                region: r.region,
                flavour: r.flavour,
                status: "Approved",
                createdAt: new Date().toISOString().slice(0, 10),
                lastActivity: new Date().toISOString().slice(0, 10),
                partnerCode: `PARTNER-${r.name.split(" ")[0].toUpperCase()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
                qr2Code: `PARTNER-${r.name.split(" ")[0].toUpperCase()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`, // Legacy support
                levels: {
                  level1: { count: 0, revenue: 0, commission: 0 },
                  level2: { count: 0, revenue: 0, commission: 0 },
                  level3: { count: 0, revenue: 0, commission: 0 },
                  level4: { count: 0, revenue: 0, commission: 0 },
                  level5: { count: 0, revenue: 0, commission: 0 },
                },
              },
            ]);
            setQueue((prev) => prev.filter((x) => x.id !== r.id));
            setRoute("intro_dashboard");
          }}
        />
      )}

      <footer className="max-w-6xl mx-auto px-4 py-10 text-xs text-zinc-500">
        Prototype UI • Levels 1-5 payout structure • Tier A/B qualification • Distribution Models 1/2 • Replace mocks with API calls
      </footer>
    </div>
  );
}


