# GovCert Project Handoff — March 31, 2026

## What Is GovCert
AI-powered government certification preparation platform. Users upload business documents, AI extracts data, pre-fills eligibility assessments and certification applications (8(a), GSA MAS, OASIS+), validates financials against regulations, and organizes everything for submission to government portals.

**Live at:** https://govcert.ai
**Owner:** Jelani House, House Strategies Group LLC
**D-U-N-S:** 105595626

---

## Architecture

### Frontend
- **Framework:** Next.js (App Router)
- **Repo:** github.com/jhouse84/govcert-web
- **Hosting:** Vercel (govcert.ai custom domain)
- **Key env var:** `NEXT_PUBLIC_API_URL=https://govcert-production.up.railway.app`

### Backend
- **Framework:** Express.js (Node.js)
- **Repo:** github.com/jhouse84/govcert
- **Hosting:** Railway
- **Database:** PostgreSQL on Railway
- **File Storage:** AWS S3 (bucket: `govcert-uploads`, region: `us-east-2`)
- **AI:** Anthropic API (Claude Opus primary, Sonnet fallback on 529)
- **Email:** SendGrid
- **ORM:** Prisma (schema at `src/prisma/schema.prisma`)

### Environment Variables (Railway)
- `DATABASE_URL` — Railway Postgres connection string
- `ANTHROPIC_API_KEY` — Anthropic API key (console.anthropic.com)
- `JWT_SECRET` — JWT signing secret
- `ENCRYPTION_KEY` — AES-256 encryption key
- `SENDGRID_API_KEY` — SendGrid email
- `SENDGRID_FROM_EMAIL` — sender email
- `AWS_ACCESS_KEY_ID` — S3 access
- `AWS_SECRET_ACCESS_KEY` — S3 secret
- `AWS_S3_BUCKET` — `govcert-uploads`
- `AWS_REGION` — `us-east-2`
- `STRIPE_SECRET_KEY` — Stripe payments
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing
- `PAYPAL_CLIENT_ID` — PayPal
- `PAYPAL_CLIENT_SECRET` — PayPal
- `QUICKBOOKS_CLIENT_ID` — Intuit (awaiting production creds)
- `QUICKBOOKS_CLIENT_SECRET` — Intuit
- `QUICKBOOKS_REDIRECT_URI` — OAuth callback
- `PRICING_BETA_MODE` — `true` = free access, `false` = payment required
- `CORS_ORIGINS` — allowed origins

### Key Accounts
- **Anthropic:** console.anthropic.com — Tier 1, $63 balance, auto-reload at $5→$15
- **AWS:** govcert-uploads bucket, IAM user `govcert-s3-uploader`
- **Stripe:** dashboard.stripe.com — webhook pointing to `/api/payments/stripe/webhook`
- **Intuit:** developer.intuit.com — awaiting production credentials
- **Railway:** railway.com — backend + Postgres
- **Vercel:** vercel.com — frontend, project `govcert-web`

---

## Pricing Model
| Tier | Price | Description |
|------|-------|-------------|
| Single Cert Prep | $1,000 one-time | AI-powered prep for one certification |
| Bundle | $2,000 one-time | AI-powered prep for multiple certs |
| Managed Service | $100/month | Ongoing 1-on-1 support, agency liaison |

Beta mode toggle: Settings → Pricing in admin dashboard. Currently ON (free access).

---

## Test Accounts
- **Admin:** test@govcert.ai / GovCert2026!
- **Customer (Sarah):** sarah.mitchell.demo@govcert.ai / GovCert2026!
- **Customer with data:** oademiluyi@gmail.com (Beacon Strategies / Nexus Partners)

---

## What's Built & Working

### Core Platform
- ✅ Registration with plan selection + email verification
- ✅ Login with account lockout (5 attempts / 15 min)
- ✅ Role-based access (ADMIN, ADVISOR, CUSTOMER)
- ✅ Client portal with sidebar navigation
- ✅ Admin dashboard with client management
- ✅ Security Trust Modal on first login (3 steps + video)
- ✅ Document upload with AI classification (category, year, usefulness)
- ✅ Document deduplication (SHA-256 hash)
- ✅ S3 file storage (uploads go to AWS, not Railway filesystem)
- ✅ Bulk document delete + individual delete

### Eligibility System
- ✅ 7-step eligibility wizard (Upload → Business → Ownership → Financials → Location → Performance → Review)
- ✅ AI extraction from uploaded documents (Opus primary, Sonnet fallback)
- ✅ Auto-population of wizard fields from extracted data
- ✅ Eligibility assessment with scoring per certification
- ✅ Binary scoring for VOSB/SDVOSB/WOSB/EDWOSB/HUBZONE (explicit NO = 0%)
- ✅ View/re-run assessment from client detail page
- ✅ Resource links on results page (NAICS, UEI, CAGE lookup URLs)

### Application Wizards
- ✅ 8(a) Business Development (6 sections: Social Disadvantage, Economic Disadvantage, Business Plan, Corporate Experience, Past Performance, Financials)
- ✅ GSA MAS (8 sections: Corporate, Experience/SINs, Past Performance, Pricing/CSP-1, QCP, Financials, Submit)
- ✅ OASIS+ (7 sections: Domains, Contract History, Past Performance, Federal Experience, Qualifying Projects, Systems/Certs, Submit)

### AI Features
- ✅ AI narrative drafting for every section (with Opus→Sonnet fallback)
- ✅ Social Disadvantage narrative generator (dual format: portal questionnaire + full PDF)
- ✅ Corporate Experience Narrative generator (regulatory, not marketing)
- ✅ Business Plan section drafting
- ✅ Past performance narrative generation per contract
- ✅ AI chat assistant on every page
- ✅ QCP/QMS narrative generation with 10,000-char limit
- ✅ CSP-1 pricing with LCAT library + IFF calculation
- ✅ GovCert Application Review (AI regulatory analysis, saved to DB)

### Document Management
- ✅ 18 document categories (FINANCIAL_STATEMENT, TAX_RETURN, INVOICE, RESUME, etc.)
- ✅ AI auto-classification on upload
- ✅ Documents queryable by category per client
- ✅ Document download through authenticated API endpoint
- ✅ Documents shown in submit pages per checklist item

### Financial Validation
- ✅ Per-cert regulatory checks (8(a): 10 checks, GSA MAS: 6, OASIS+: 4)
- ✅ Accrual basis detection + validation per 13 CFR 124.602(d)
- ✅ Revenue/tax return cross-reference
- ✅ Net worth, AGI, total assets threshold checks for 8(a)
- ✅ Current ratio calculation for GSA MAS
- ✅ FinancialReadiness component on all 3 submit pages

### Submission Wizards
- ✅ 8(a): Full SBA Form 1010 submission guide with expandable per-document guidance
- ✅ GSA MAS: eOffer submission guide with 11 document items
- ✅ OASIS+: Symphony portal submission guide with 11 document items
- ✅ Each item shows: What is it, Where to find it, Portal navigation, Format requirements
- ✅ Matching uploaded docs shown with download buttons
- ✅ Missing doc warnings with links to upload
- ✅ Past performance copy-to-portal cards (8(a))
- ✅ Copy narratives to clipboard for all sections
- ✅ Character counters matching actual portal limits (1K for SBA, 10K for eOffer)

### Form Generation
- ✅ SBA Form 413 PDF generator (pre-filled from economic disadvantage data)
- ✅ Form 413 blocks generation when data incomplete, shows what's missing
- ✅ Generic narrative PDF export endpoint
- ✅ CSP-1 CSV export

### PPQ (Past Performance Questionnaire)
- ✅ Send PPQ emails to references (SendGrid)
- ✅ Public PPQ form for references to complete
- ✅ PPQ status tracking (NOT_SENT, SENT, OPENED, COMPLETED, DECLINED)
- ✅ PPQ data flows back into application

### Payments
- ✅ Stripe checkout (one-time + subscription)
- ✅ PayPal checkout
- ✅ Admin pricing management (Settings → Pricing)
- ✅ Beta mode toggle (bypasses payment when ON)
- ✅ requirePayment middleware on all AI endpoints

### Security
- ✅ AES-256 encryption references throughout
- ✅ Input sanitization middleware (XSS, HTML stripping)
- ✅ File magic byte validation
- ✅ CORS locked to specific origins
- ✅ Helmet.js security headers
- ✅ Rate limiting (auth: 10/15m, AI: 10/m, general: 100/m)
- ✅ PII masking in logs
- ✅ Debug endpoints removed from production
- ✅ D&B verified (D-U-N-S: 105595626)
- ✅ CSA STAR registration referenced
- ✅ Security Trust Modal with video

### Integrations
- ✅ QuickBooks OAuth flow (code complete, awaiting Intuit production creds)
- ✅ SAM.gov lookup (NAICS, UEI validation)

---

## CRITICAL — Blocks Launch

1. **RedraftWizard not wired in** — Component built (`components/RedraftWizard.tsx`) but not imported into corporate experience pages. Redraft buttons still fire AI blindly without guided prompts.

2. **ApplicationCoachingModal not wired in** — Component built (`components/ApplicationCoachingModal.tsx`) but not imported into application wizard start flow. Coaching endpoint works but UI doesn't trigger it.

3. **SecurityBadge/ProvenanceBadge not wired in** — Components built (`components/SecurityBadge.tsx`) but not placed in wizard sections. Auto-populated fields don't show provenance ("filled from Tax Return").

4. **Old files lost** — Any documents uploaded before S3 migration are gone from Railway's filesystem. DB records exist but files don't. Need to handle gracefully (show "file unavailable, please re-upload").

5. **Download endpoint may fail for pre-S3 docs** — `/api/documents/download/:id` tries S3 first, falls back to local filesystem. Pre-S3 docs will 404 on both. Need error handling.

6. **JWT_SECRET and ENCRYPTION_KEY hardcoded fallbacks** — Server still has fallback values in code. Should fail hard if env vars missing.

7. **Tokens in localStorage** — XSS vulnerable. Should move to httpOnly cookies or add strict CSP headers.

---

## HIGH — Fix Before Launch

8. **Financial extraction missing detail** — AI extraction pulls revenue but often misses COGS, gross profit, operating expenses, net income, balance sheet items from financial documents. Extraction prompt needs expansion.

9. **Eligibility wizard "Analyze Documents" only works for docs uploaded in that session** — Should detect and offer to analyze ALL unanalyzed docs in the client's record.

10. **govcert-web.vercel.app still accessible** — Old URL should redirect to govcert.ai. Add redirect in next.config.js.

11. **Past performance copy-to-portal missing from GSA MAS and OASIS+ submit pages** — Only built for 8(a). Same pattern needed for eOffer and Symphony.

12. **Character limits in AI drafting** — Updated for GSA MAS (10K) and social disadvantage (1K) but other sections may still use old generic limits.

13. **Net worth calculator page** — Route exists at `/portal/resources/net-worth` but page may be incomplete. Beta tester requested guidance on calculating net worth.

14. **WOSB self-certification guidance** — Should explain WOSB is self-certification, not SBA-reviewed. Need clear guidance page.

15. **Cloud storage upload support** — Beta tester reported can't upload from Dropbox/Google Drive on mobile. File input should support cloud storage providers.

---

## MEDIUM — Fix Soon After Launch

16. **2FA (Two-Factor Authentication)** — Plan approved, not implemented. Schema changes + TOTP endpoints + frontend UI needed.

17. **Job queue for AI calls** — Currently inline. Under load, concurrent users will hit Anthropic rate limits. Need BullMQ or DB-backed queue.

18. **Database backups to S3** — Railway has auto-backups but secondary off-platform backup recommended.

19. **Notification emails** — Missing: application status updates, document upload confirmations, eligibility assessment complete notifications.

20. **Mobile responsiveness** — Some pages may not render well on mobile. Beta tester used phone successfully but cloud upload didn't work.

21. **Export packages** — ZIP download organized by cert agency folder structure (8(a) → Financial Documents, Personal Documents, etc.). Endpoint not built.

22. **Landing page improvements** — Need "Book a Demo" CTA, distinct video sections, SEO blog template.

---

## LOW — Future Roadmap

23. **FedRAMP** — Long-term credibility play for agency customers.
24. **Trademark filing** — "GovCert" under Class 42 (SaaS).
25. **Provisional patent** — AI pipeline (extraction → scoring → auto-fill → validation).
26. **WOSB/SDVOSB/HUBZONE/VOSB application wizards** — Currently only eligibility, no full application prep.
27. **Advisor portal** — Multi-client management for consultants.
28. **API rate limit tier upgrade** — Contact Anthropic sales for custom limits.
29. **Monthly invoicing** — Contact Anthropic for post-pay billing.
30. **Capability statement generator** — AI-generated from uploaded docs (beta tester request).

---

## Market Sizing

### Target Market: Small Businesses Pursuing Government Certifications

**Total Addressable Market (TAM):**
- ~33 million small businesses in the US (SBA)
- ~400,000+ small businesses registered in SAM.gov for federal contracting
- ~170,000 small businesses with active federal contracts
- Government contracting market: ~$700B annually, ~26% ($180B) goes to small businesses

**Serviceable Addressable Market (SAM):**
- ~50,000 businesses apply for or maintain SBA certifications annually
- ~15,000 8(a) applications/year (SBA processes ~8,000-10,000 with ~40% approval)
- ~5,000 new GSA Schedule offers/year
- ~10,000+ businesses pursuing WOSB, SDVOSB, HUBZone annually
- **Total ~80,000 certification events/year**

**Serviceable Obtainable Market (SOM) — Year 1-3:**
- Realistic capture: 1-3% of certification events
- Year 1: 800-2,400 customers
- Year 2: 2,000-5,000 customers
- Year 3: 4,000-10,000 customers

### Revenue Projections

**At current pricing ($1,000 single / $2,000 bundle / $100/mo managed):**

| Year | Customers | Mix | Revenue |
|------|-----------|-----|---------|
| Year 1 | 500 | 60% single, 25% bundle, 15% managed | $800K-$1.2M |
| Year 2 | 1,500 | 50% single, 30% bundle, 20% managed | $2.5M-$3.5M |
| Year 3 | 3,500 | 40% single, 35% bundle, 25% managed | $5M-$8M |

### Unit Economics
- **COGS per customer:** ~$5-15 in Anthropic API calls + ~$0.10 S3 storage = ~$15
- **Gross margin:** ~98%
- **CAC targets:**
  - Organic (LinkedIn, SEO, PTAC referrals): $50-100
  - Google Ads ("8a certification help"): $100-300
  - Paid partnerships (APEX Accelerators, SCORE): $50-150
  - Target blended CAC: $150

### Ad Spend Guidance
- **Month 1-3 (validation):** $500-1,000/mo on Google Ads targeting high-intent keywords
- **Month 4-6 (scaling):** $2,000-5,000/mo adding LinkedIn ads targeting veteran/minority business owners
- **Month 7-12 (growth):** $5,000-15,000/mo across Google, LinkedIn, conference sponsorships
- **Rule of thumb:** Keep CAC below 15% of average deal value ($150 CAC on $1,000 deal)

### Competitive Landscape
- **Direct competitors:** EZ8a (~$3,500-5,000 for full service), Federal Filing (~$2,500), various consultants ($5,000-15,000)
- **GovCert advantage:** AI-powered self-service at 1/3-1/5 the price, plus managed option
- **ChatGPT/generic AI:** No cert-specific knowledge, no portal integration, no document management, no validation against regulations
- **PTACs/APEX Accelerators:** Free but limited bandwidth, months-long wait, no AI

### Key Distribution Channels
1. **PTAC/APEX Accelerator partnerships** — 300+ centers nationwide, each counsels hundreds of businesses
2. **SBA District Office referrals** — 68 offices running certification workshops
3. **Google Ads** — "8a certification", "GSA schedule application", "government certification help"
4. **LinkedIn** — Direct outreach to #GovCon community, veteran/minority business groups
5. **NVSBC, WBENC, NMSDC events** — Conference sponsorships and demos

---

## File Structure Quick Reference

### Backend (govcert/)
```
src/
├── prisma/schema.prisma          # Database schema
├── middleware/
│   ├── auth.js                   # JWT auth, role-based access
│   └── sanitize.js               # Input sanitization
├── routes/
│   ├── auth.js                   # Login, register, password reset
│   ├── clients.js                # Client CRUD, sample data generation
│   ├── applications.js           # App CRUD, all AI endpoints, financial validation
│   ├── upload.js                 # Document upload, AI classification, S3
│   ├── documents.js              # Document access, download from S3
│   ├── payments.js               # Stripe, PayPal, requirePayment middleware
│   ├── pricing.js                # Admin pricing management
│   ├── team.js                   # Team/advisor management
│   └── invites.js                # Advisor invitations
├── services/
│   ├── extractionService.js      # AI document extraction pipeline
│   ├── applicationPopulationService.js  # Auto-populate apps from eligibility
│   ├── financialValidationService.js    # Per-cert financial checks
│   ├── formGeneratorService.js   # PDF generation (Form 413, narratives)
│   ├── clientDataService.js      # Full client context assembly
│   └── usageService.js           # API usage tracking
└── server.js                     # Express app, middleware, route mounting
```

### Frontend (govcert-web/)
```
app/
├── page.tsx                      # Landing page
├── login/page.tsx                # Login
├── register/page.tsx             # Registration
├── portal/                       # Customer portal
│   ├── page.tsx                  # Portal home (security modal here)
│   ├── eligibility/page.tsx      # Eligibility wizard (7 steps)
│   ├── eligibility/results/      # Eligibility results
│   ├── documents/page.tsx        # Document manager (bulk delete)
│   ├── profile/page.tsx          # User profile
│   └── applications/page.tsx     # My applications
├── certifications/[id]/          # Application wizards
│   ├── 8a/                       # 8(a) sections
│   │   ├── social-disadvantage/
│   │   ├── economic-disadvantage/
│   │   ├── business-plan/
│   │   ├── corporate/
│   │   ├── past-performance/
│   │   ├── financials/
│   │   ├── review/
│   │   └── submit/
│   ├── oasis-plus/               # OASIS+ sections
│   ├── corporate/                # GSA MAS corporate experience
│   ├── pricing/                  # GSA MAS CSP-1
│   ├── qcp/                      # GSA MAS quality control
│   ├── review/                   # GSA MAS review
│   └── submit/                   # GSA MAS submit
├── dashboard/                    # Admin dashboard
├── clients/                      # Admin client management
├── documents/                    # Admin document view
└── settings/                     # Admin settings (pricing, team)

components/
├── SecurityTrustModal.tsx        # Login security walkthrough
├── FinancialReadiness.tsx        # Financial validation display
├── RedraftWizard.tsx             # Guided AI drafting (NOT WIRED IN)
├── ApplicationCoachingModal.tsx  # First-app coaching (NOT WIRED IN)
├── SecurityBadge.tsx             # Security indicators (NOT WIRED IN)
├── PaywallModal.tsx              # Payment gate
├── CertSidebar.tsx               # Application sidebar nav
└── EligibilityScorecard.tsx      # Eligibility results display
```

---

## Git Tags for Safety
- Tags were created before major changes as rollback points
- Check with `git tag -l` in each repo

## Last Commits
- Backend: `0f166b6` — Accrual basis check
- Frontend: `be9ed00` — Form 413 incomplete data blocking
