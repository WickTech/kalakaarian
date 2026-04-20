// Generates the Kalakaarian Product Requirements Document (PRD).
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  TabStopType, TabStopPosition,
} = require('docx');

const FONT = 'Arial';
const border = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
const cellBorders = { top: border, bottom: border, left: border, right: border };

const para = (text, opts = {}) => new Paragraph({
  spacing: { before: 80, after: 80, line: 300 },
  ...opts,
  children: [new TextRun({ text, font: FONT, size: 22, ...opts.run })],
});

const bold = (text) => new TextRun({ text, font: FONT, size: 22, bold: true });
const run = (text, extra = {}) => new TextRun({ text, font: FONT, size: 22, ...extra });

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 180 },
  children: [new TextRun({ text, font: FONT, size: 36, bold: true, color: '0B3954' })],
});
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 120 },
  children: [new TextRun({ text, font: FONT, size: 28, bold: true, color: '1D4E77' })],
});
const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 80 },
  children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: '2E75B6' })],
});

const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  spacing: { before: 40, after: 40, line: 280 },
  children: [run(text)],
});

const bulletRich = (parts, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  spacing: { before: 40, after: 40, line: 280 },
  children: parts,
});

const numbered = (text) => new Paragraph({
  numbering: { reference: 'numbers', level: 0 },
  spacing: { before: 40, after: 40, line: 280 },
  children: [run(text)],
});

const cell = (text, opts = {}) => new TableCell({
  borders: cellBorders,
  width: { size: opts.width || 4680, type: WidthType.DXA },
  shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
  margins: { top: 100, bottom: 100, left: 140, right: 140 },
  children: (Array.isArray(text) ? text : [text]).map(t =>
    typeof t === 'string'
      ? new Paragraph({ children: [run(t, { bold: !!opts.bold, color: opts.color })] })
      : t
  ),
});

const headCell = (text, width) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  shading: { fill: '0B3954', type: ShadingType.CLEAR },
  margins: { top: 100, bottom: 100, left: 140, right: 140 },
  children: [new Paragraph({ children: [run(text, { bold: true, color: 'FFFFFF' })] })],
});

const metaRow = (label, value) => new TableRow({
  children: [
    cell(label, { width: 2880, shade: 'EAF2F8', bold: true }),
    cell(value, { width: 6480 }),
  ],
});

// ---------- Build content ----------

const cover = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2400, after: 240 },
    children: [new TextRun({ text: 'KALAKAARIAN', font: FONT, size: 72, bold: true, color: '0B3954' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'Influence. Impact. Growth.', font: FONT, size: 28, italics: true, color: '2E75B6' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 720 },
    children: [new TextRun({ text: 'Product Requirements Document (PRD)', font: FONT, size: 32, bold: true })],
  }),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2880, 6480],
    rows: [
      metaRow('Product', 'Kalakaarian — Creator × Brand Marketplace (PWA)'),
      metaRow('Document Type', 'Product Requirements Document'),
      metaRow('Version', '1.0'),
      metaRow('Status', 'Draft'),
      metaRow('Date', '20 April 2026'),
      metaRow('Owner', 'Rishabh Verma'),
      metaRow('Source Artifact', 'Kalakaarian Web app Flow.docx'),
      metaRow('Target Platforms', 'Progressive Web App (desktop + mobile), installable on Android / iOS'),
    ],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

const execSummary = [
  h1('1. Executive Summary'),
  para(
    'Kalakaarian is a tier-based creator–brand marketplace delivered as a Progressive Web App (PWA). ' +
    'Brands discover creators ("Kalakaars") filtered by tier, genre, location and budget; creators onboard by ' +
    'connecting their Instagram and YouTube accounts, after which AI computes engagement and pricing analytics ' +
    'that are displayed directly on their profile.'
  ),
  para(
    'The product enables the full campaign lifecycle in a single room — selection, brief delivery, payment, ' +
    'execution review and invoicing — with an internal Operations & Execution team sitting between brand and ' +
    'creator to guarantee deliverable quality before payout is released.'
  ),
  para(
    'This document defines the scope, user journeys, functional and non-functional requirements, success metrics ' +
    'and phasing for v1 of the PWA, based on the latest web-app flow and the existing server implementation in ' +
    'the Kalakaarian codebase.'
  ),
];

const vision = [
  h1('2. Product Vision & Goals'),
  h2('2.1 Vision'),
  para(
    'Become India\'s default trust layer between brands and content creators — where brands can run a campaign ' +
    'end-to-end in an afternoon, and where creators get paid reliably for work that is reviewed, approved and ' +
    'archived with a downloadable invoice trail.'
  ),
  h2('2.2 Goals (v1)'),
  bullet('Launch a PWA that works offline-first on 4G mobile devices and is installable from the browser.'),
  bullet('Reduce brand time-to-first-campaign to < 30 minutes from signup to payment.'),
  bullet('Onboard creators with a single flow: phone OTP + Instagram/YouTube connect + auto-populated analytics.'),
  bullet('Make pricing transparent via AI-calculated ER%, engagement and CPV shown on every profile.'),
  bullet('Operate a guardrail: no payout is released until the Execution team approves deliverables against brief.'),
  h2('2.3 Non-Goals (v1)'),
  bullet('Native iOS/Android apps — the PWA covers mobile install use cases.'),
  bullet('Cross-border payments — v1 is India-only (INR, UPI up to ₹5L, NEFT/RTGS, domestic cards).'),
  bullet('Automated content generation — the platform curates human creators, not AI content.'),
  bullet('Influencer-discovery for agencies/resellers — v1 targets direct-to-brand use only.'),
];

const personas = [
  h1('3. Target Users & Personas'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1800, 2400, 2580, 2580],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headCell('Persona', 1800),
          headCell('Who', 2400),
          headCell('Primary Jobs-to-be-Done', 2580),
          headCell('Key Success Signal', 2580),
        ],
      }),
      new TableRow({ children: [
        cell('Brand', { width: 1800 }),
        cell('Marketing / growth lead at a D2C or SME brand in India', { width: 2400 }),
        cell('Find the right creator at the right price, brief them, get the deliverable, pay, get an invoice', { width: 2580 }),
        cell('Campaign completed within 14 days of signup', { width: 2580 }),
      ]}),
      new TableRow({ children: [
        cell('Creator (Kalakaar)', { width: 1800 }),
        cell('Nano to Celebrity tier Instagram / YouTube creator', { width: 2400 }),
        cell('Get discovered, set pricing, upload deliverable, receive payment without chasing', { width: 2580 }),
        cell('≥ 1 paid collaboration per month once active', { width: 2580 }),
      ]}),
      new TableRow({ children: [
        cell('Ops / Execution', { width: 1800 }),
        cell('Internal Kalakaarian team', { width: 2400 }),
        cell('Review uploaded videos against brief, request edits, approve to release payout', { width: 2580 }),
        cell('< 24h review SLA on every submission', { width: 2580 }),
      ]}),
      new TableRow({ children: [
        cell('Admin', { width: 1800 }),
        cell('Kalakaarian founders / finance', { width: 2400 }),
        cell('Oversee memberships, payouts, refunds, moderate contact requests', { width: 2580 }),
        cell('100% payout reconciliation, zero fraud leak', { width: 2580 }),
      ]}),
    ],
  }),
];

const scope = [
  h1('4. Scope & Platform'),
  h2('4.1 Platforms'),
  bullet('Responsive web + installable PWA (mobile-first). Desktop supported for brand workflows.'),
  bullet('Manifest + service worker: installable, home-screen icon, splash, offline shell, push notifications.'),
  bullet('Target devices: Android 10+, iOS 16+ (Safari), modern desktop browsers.'),
  h2('4.2 In Scope (v1)'),
  bullet('Public marketing site (Sections 1, 2, 3, 5 of flow doc).'),
  bullet('Brand signup + Creator signup with OTP.'),
  bullet('Creator profile with auto-pulled analytics and premium memberships.'),
  bullet('Creator discovery ("Creators tier page") with tier / location / genre / sort / filter.'),
  bullet('Cart, campaign brief upload, checkout with UPI / cards / NEFT / RTGS.'),
  bullet('Brand "Your ROOM" dashboard with current + previous campaigns and invoices.'),
  bullet('Post-campaign execution workflow (creator upload → Ops review → approve → payout).'),
  bullet('Notifications (WhatsApp + email + in-app), feed, refer-and-earn, AI chatbot for support.'),
  h2('4.3 Out of Scope (v1)'),
  bullet('Multi-brand agency accounts, white-label, native apps, international currencies, creator-side payouts to non-Indian banks.'),
];

const sitemap = [
  h1('5. Information Architecture'),
  para('Mapped from the six sections of the source flow document:'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1200, 3000, 5160],
    rows: [
      new TableRow({ tableHeader: true, children: [
        cell('Section', { width: 1200, shade: 'EAF2F8', bold: true }),
        cell('Page / Surface', { width: 3000, shade: 'EAF2F8', bold: true }),
        cell('Purpose', { width: 5160, shade: 'EAF2F8', bold: true }),
      ]}),
      new TableRow({ children: [
        cell('S1', { width: 1200 }),
        cell('Landing / Hero', { width: 3000 }),
        cell('"Influence Impact Growth" hero (Oswald font), Get Started CTAs, Start as Brand / Join as Kalakaar dropdowns, About.', { width: 5160 }),
      ]}),
      new TableRow({ children: [
        cell('S2', { width: 1200 }),
        cell('Tier Intro Strip', { width: 3000 }),
        cell('"Find your perfect Kalakaar — tier-based, budget-friendly, goal-ready" band on landing.', { width: 5160 }),
      ]}),
      new TableRow({ children: [
        cell('S3', { width: 1200 }),
        cell('Contact Us', { width: 3000 }),
        cell('Contact form + AI chatbot with human handoff option.', { width: 5160 }),
      ]}),
      new TableRow({ children: [
        cell('S4', { width: 1200 }),
        cell('Creators Tier Page (post brand login)', { width: 3000 }),
        cell('Discovery surface with tier / location / genre / sort / filter controls and campaign-type toggles.', { width: 5160 }),
      ]}),
      new TableRow({ children: [
        cell('S5', { width: 1200 }),
        cell('Platform Toggle', { width: 3000 }),
        cell('Sub-header switch: Instagram | YouTube filters creator list by connected platform.', { width: 5160 }),
      ]}),
      new TableRow({ children: [
        cell('S6', { width: 1200 }),
        cell('App Chrome + Cart + Feed', { width: 3000 }),
        cell('Top bar (logo, day/night, cart); cart = campaign creation; bottom tab: social feed + notifications.', { width: 5160 }),
      ]}),
    ],
  }),
];

const fr = [
  h1('6. Functional Requirements'),

  h2('6.1 Public Marketing Site'),
  bullet('Header: Kalakaarian logo (background-matching colour) + day/night toggle.'),
  bullet('Hero copy "Influence Impact Growth" in Oswald font; "About" text in white.'),
  bullet('Top-right actions: Start as Brand, Join as Kalakaar (Creator), Login dropdown (Brand or Creator).'),
  bullet('"Get Started" → all-creators listing page (Section 4).'),
  bullet('Tier strip (Section 2) with descriptive copy.'),
  bullet('Contact Us (Section 3): Name / Email / Message / "Get a call" + AI chatbot with "connect with representative" escalation.'),

  h2('6.2 Brand Onboarding'),
  bullet('Form fields: Name, Work Email (domain captured for future auto-login), WhatsApp number, Industry.'),
  bullet('Social sign-in with Google or Outlook; work-email domain is the brand identity.'),
  bullet('Post-signup: land on Creators Tier Page (Section 4).'),
  bulletRich([bold('Acceptance: '), run('corporate domain captured, stored on BrandProfile; same domain auto-resolves company on future signups from same domain.')]),

  h2('6.3 Creator Onboarding (Join as Kalakaar)'),
  numbered('Name → Email → WhatsApp number with OTP confirmation.'),
  numbered('Select genre (Food, Tech, Product, Product Review, Cooking, Fashion & Lifestyle, Grooming, Travel, Fitness, Sports, Gaming, Education, News, Other-text).'),
  numbered('Connect Instagram and/or YouTube via OAuth.'),
  numbered('Enter commercials: Instagram Reels + Stories (Collaborative) and/or YouTube Long-form + Shorts. A 5% platform margin is added on top of the creator quote before a brand sees the price.'),
  numbered('Land on auto-generated profile; pricing shown to brands reflects the right combination based on what the brand selects.'),
  bulletRich([bold('Constraint: '), run('OTP is hashed and TTL-expired in MongoDB (OtpCode model); OTP is never logged or kept in memory.')]),

  h2('6.4 Creator Profile & Analytics'),
  bullet('Display picture auto-pulled from Instagram (editable); "Active now" toggle with green indicator when ON.'),
  bullet('Instagram and YouTube analytics surface only if that platform is connected.'),
  bulletRich([bold('AI-computed metrics (shown on profile card + full analytics page): '), run('')]),
  bullet('ER % = (Likes + Comments + Shares) / Reach × 100', 1),
  bullet('Engagement = Likes + Comments + Shares / Reach', 1),
  bullet('CPV (Cost Per View) = (Cost of Reel & Story) / Average Views', 1),
  bullet('Fake-following % via Modash link or report', 1),
  bullet('Premium badge (golden # for Gold, silver # for Silver) displayed on card.'),
  h3('6.4.1 Video Deliverables'),
  bullet('Upload options: Instagram/YouTube link OR direct video upload from system.'),
  bullet('"Task Completed" button submits for Ops review; video goes to Execution queue.'),
  bullet('Ops verdicts: Approve, Reject with comment, Request edits (Execution team can re-edit and re-submit).'),
  bullet('Outcome is delivered to the creator on WhatsApp + email.'),
  h3('6.4.2 Settings'),
  bullet('Account settings: change email, change WhatsApp number (OTP required for phone change).'),
  bullet('Collaborations: list of brands the creator has worked with.'),
  bullet('Search other creators (directory lookup).'),

  h2('6.5 Memberships (Gold / Silver)'),
  bullet('Gold @ ₹149 — top banner placement, highest selection priority; 1 year free Gold if creator refers 10 Gold sign-ups.'),
  bullet('Silver — 2x–3x selection chances; free Silver membership when referred creator buys Silver.'),
  bullet('Auto-debit with "Cancel anytime" available from settings.'),
  bullet('One referral code per creator, lifetime validity.'),

  h2('6.6 Brand Profile & "Your ROOM"'),
  bullet('Profile: Name, Position, Company Name (auto from email domain, editable).'),
  bullet('"Get Your ROOM" — ₹999 rent to unlock campaign workspace.'),
  bullet('Within the ROOM: create next campaign, keep selected creators, schedule start month, add payment method.'),
  bullet('Your Campaigns widget (current campaign dropdown) showing 4-step progress: Selected Creators ✅ → Shooting ✅ → Uploaded by Creator ✅ → Payment Done ✅.'),
  bullet('Primary CTA: "Create a New Campaign".'),
  h3('6.6.1 Previous Campaigns Dashboard'),
  bullet('Table view: date, creator profile, Instagram/YouTube video links, Download button (opens in new tab), Invoice PDF with download.'),

  h2('6.7 Creator Discovery (Section 4 — Creators Tier Page)'),
  bullet('Tier dropdown: All, Nano, Micro, Macro, Celebrity.'),
  bullet('Location cascade: Country → Region → City.'),
  bullet('Genre: All, Food, Tech, Product, Product Review, Cooking, Fashion & Lifestyle, Grooming, Travel, Fitness, Sports, Gaming, Education, News, Other (free-text).'),
  bullet('Sort: Popular, Relevant, High → Low, Low → High (by price).'),
  bullet('Filters: Follower Count (from-to), Per-Creator Budget (₹ numeric), Gender (Male / Female).'),
  bullet('Campaign Type chips: Reel, Story, YT Video, UGC Content.'),
  bullet('Section 5 sub-header: Instagram | YouTube platform toggle filters the same list.'),

  h2('6.8 Cart & Checkout (Section 6)'),
  bullet('Cart icon in top bar shows selected creator profiles and cumulative amount.'),
  bullet('Mandatory: Campaign Name (reflects into "Your Campaigns" after checkout), Campaign Brief document upload.'),
  bullet('On submit: brief auto-delivered to each selected creator via WhatsApp + email.'),
  bullet('Payment methods: UPI (up to ₹5 Lakh), Debit, Credit, NEFT, RTGS. Bank-ID path deep-links to the brand\'s banking portal.'),
  bullet('Payment gateway captures funds to the Kalakaarian merchant account; invoice PDF auto-mailed to brand contact and stored in Invoices section of Your Campaigns.'),

  h2('6.9 Post-Campaign Execution Workflow'),
  numbered('Creator uploads Google Drive link or direct video + campaign links (Instagram/YouTube/both) via three-dot action, selects "Task Completed".'),
  numbered('Execution team reviews against brand brief.'),
  numbered('If changes needed: Execution team edits internally, re-uploads, marks "Approved".'),
  numbered('On approval: creator receives "Withdraw" notification; Withdraw CTA turns green.'),
  numbered('Brand sees the video on the Your Campaigns page with download + Instagram/YouTube links.'),
  bulletRich([bold('Contract: '), run('creator upload auto-propagates to the brand view — do not require manual re-link by the brand.')]),

  h2('6.10 Feed, Notifications & Reviews'),
  bullet('Bottom taskbar Feed (Instagram-style): creator videos, images, meme pages, with Like interactions.'),
  bullet('Notification bell on both brand and creator profiles (WhatsApp / email / push / in-app).'),
  bullet('"Review Our Services" link from Brand profile → Google Reviews.'),

  h2('6.11 Refer & Earn'),
  bullet('One lifetime code per creator.'),
  bullet('10 Gold referrals → 1 year Gold free.'),
  bullet('Silver referral on Silver purchase → Silver free for referrer.'),

  h2('6.12 Support — AI Chatbot'),
  bullet('Answers common queries: signup help, payment status, tier definitions, campaign timelines.'),
  bullet('"Connect with representative" handoff at any point (ticket is created + email notification to support).'),
];

const nfr = [
  h1('7. Non-Functional Requirements'),
  h2('7.1 PWA Characteristics'),
  bullet('Web App Manifest with name, short_name, icons (192, 512), theme & background colour matching day/night mode.'),
  bullet('Service Worker with app-shell caching, stale-while-revalidate for profile lists, cache-first for static assets.'),
  bullet('Installable on Android home screen (Add to Home Screen) and iOS Safari "Add to Home Screen".'),
  bullet('Web Push Notifications (FCM) for brand/creator campaign events; iOS 16.4+ supported via installed PWA.'),
  bullet('Offline fallback page; feed and previous campaigns read from IndexedDB when offline.'),
  bullet('Lighthouse PWA score ≥ 90 before launch.'),
  h2('7.2 Performance'),
  bullet('First Contentful Paint < 1.8s on 4G (median Android).'),
  bullet('Creator list pagination: 20 per page, max 100 (hard-clamped server-side).'),
  bullet('Image delivery via CDN with responsive srcset; lazy-load below the fold.'),
  h2('7.3 Security'),
  bullet('Authentication: JWT issued post-OTP or Google/Outlook OAuth; refresh tokens rotated.'),
  bullet('Google ID tokens verified via google-auth-library (OAuth2Client.verifyIdToken) — never base64-decoded.'),
  bullet('OTPs stored hashed in MongoDB with TTL; never logged.'),
  bullet('Rate-limiting on auth and OTP routes (per-phone for OTP).'),
  bullet('CORS allowlist from CORS_ORIGINS env (no wildcard).'),
  bullet('NoSQL injection protection (express-mongo-sanitize globally).'),
  bullet('All user-supplied regex inputs (city, q) escaped before $regex.'),
  bullet('Admin contact routes guarded by auth + requireAdmin.'),
  bullet('Payment data never stored locally — gateway tokens only.'),
  h2('7.4 Privacy & Compliance'),
  bullet('Personally identifiable information encrypted at rest.'),
  bullet('India-localised data residency for MongoDB cluster.'),
  bullet('GST-compliant invoice PDF generated for every transaction.'),
  h2('7.5 Accessibility'),
  bullet('WCAG 2.1 AA compliance; colour contrast validated in both day and night themes.'),
  bullet('Keyboard navigation across all forms; focus-visible rings.'),
  bullet('Form labels, aria-live regions on OTP verification, alt text on creator images.'),
];

const arch = [
  h1('8. Architecture & Tech Stack (as implemented)'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2200, 7160],
    rows: [
      new TableRow({ children: [ cell('Frontend', { width: 2200, shade: 'EAF2F8', bold: true }), cell('React + Vite, Tailwind CSS, shadcn/ui, TypeScript; PWA via vite-plugin-pwa (to be added if not present).', { width: 7160 }) ]}),
      new TableRow({ children: [ cell('Backend', { width: 2200, shade: 'EAF2F8', bold: true }), cell('Node.js + Express (TypeScript), deployed from server/src only via vercel.json.', { width: 7160 }) ]}),
      new TableRow({ children: [ cell('Database', { width: 2200, shade: 'EAF2F8', bold: true }), cell('MongoDB (Mongoose). Cached-promise pattern via connectDB() in config/database.ts.', { width: 7160 }) ]}),
      new TableRow({ children: [ cell('Auth', { width: 2200, shade: 'EAF2F8', bold: true }), cell('JWT + Google/Outlook OAuth; OTP via WhatsApp provider; AuthRequest typing on req.user.', { width: 7160 }) ]}),
      new TableRow({ children: [ cell('Payments', { width: 2200, shade: 'EAF2F8', bold: true }), cell('Payment gateway (UPI + cards + net banking); NEFT/RTGS deep-link to brand banking portal.', { width: 7160 }) ]}),
      new TableRow({ children: [ cell('Notifications', { width: 2200, shade: 'EAF2F8', bold: true }), cell('WhatsApp Business API, transactional email, Web Push (FCM).', { width: 7160 }) ]}),
      new TableRow({ children: [ cell('Social Integrations', { width: 2200, shade: 'EAF2F8', bold: true }), cell('Instagram Graph API, YouTube Data API; AI analytics pipeline computes ER%, Engagement, CPV.', { width: 7160 }) ]}),
      new TableRow({ children: [ cell('Hosting', { width: 2200, shade: 'EAF2F8', bold: true }), cell('Vercel (web + API). Static assets via Vercel Edge.', { width: 7160 }) ]}),
    ],
  }),
  h2('8.1 Existing Domain Models (reference)'),
  para('The following Mongoose models already exist in server/src/models and map to the requirements above:'),
  bullet('User, BrandProfile, InfluencerProfile, InfluencerAnalytics — identity & profile.'),
  bullet('OtpCode — hashed OTPs with TTL.'),
  bullet('Campaign, CampaignFile, CampaignVideo, CampaignWorkflow — campaign lifecycle.'),
  bullet('Cart, Proposal, Transaction — commerce & negotiations.'),
  bullet('Membership, Referral — monetisation.'),
  bullet('Contact, Conversation, Message, Notification — comms.'),
];

const metrics = [
  h1('9. Success Metrics'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2200, 2800, 4360],
    rows: [
      new TableRow({ tableHeader: true, children: [
        headCell('Pillar', 2200),
        headCell('Metric', 2800),
        headCell('v1 Target (6 months post-launch)', 4360),
      ]}),
      new TableRow({ children: [ cell('Supply', { width: 2200 }), cell('Active verified creators', { width: 2800 }), cell('2,500', { width: 4360 }) ]}),
      new TableRow({ children: [ cell('Demand', { width: 2200 }), cell('Brands with "Your ROOM" unlocked', { width: 2800 }), cell('300', { width: 4360 }) ]}),
      new TableRow({ children: [ cell('Activation', { width: 2200 }), cell('Brand signup → first paid campaign', { width: 2800 }), cell('< 30 minutes median', { width: 4360 }) ]}),
      new TableRow({ children: [ cell('Conversion', { width: 2200 }), cell('Creators added to cart → paid', { width: 2800 }), cell('≥ 35%', { width: 4360 }) ]}),
      new TableRow({ children: [ cell('Trust', { width: 2200 }), cell('Ops approval SLA', { width: 2800 }), cell('< 24 hours p95', { width: 4360 }) ]}),
      new TableRow({ children: [ cell('Monetisation', { width: 2200 }), cell('Creators on paid membership', { width: 2800 }), cell('15% of active creators', { width: 4360 }) ]}),
      new TableRow({ children: [ cell('Retention', { width: 2200 }), cell('Brand repeat rate within 60 days', { width: 2800 }), cell('≥ 40%', { width: 4360 }) ]}),
      new TableRow({ children: [ cell('PWA', { width: 2200 }), cell('PWA install rate (mobile)', { width: 2800 }), cell('≥ 20% of MAU', { width: 4360 }) ]}),
    ],
  }),
];

const phasing = [
  h1('10. Phasing & Milestones'),
  h2('Phase 1 — Foundation (Weeks 0–4)'),
  bullet('Landing site (S1, S2, S3), brand + creator signup, OTP, Google/Outlook auth, PWA shell.'),
  h2('Phase 2 — Discovery + Commerce (Weeks 5–9)'),
  bullet('Creators Tier Page (S4), Instagram/YouTube analytics sync, cart + payments, invoice PDF.'),
  h2('Phase 3 — Lifecycle (Weeks 10–13)'),
  bullet('Your ROOM, campaign workflow, Ops execution review, WhatsApp + email notifications.'),
  h2('Phase 4 — Growth (Weeks 14–17)'),
  bullet('Memberships (Gold/Silver), Refer & Earn, Feed + Likes, AI chatbot, Reviews.'),
  h2('Phase 5 — Harden (Weeks 18–20)'),
  bullet('Performance, a11y, Lighthouse PWA ≥ 90, push notifications on iOS installed PWA.'),
];

const risks = [
  h1('11. Risks & Open Questions'),
  h2('11.1 Risks'),
  bullet('Instagram / YouTube API rate limits may delay analytics refresh — mitigate with background job + cache.'),
  bullet('Execution-team bottleneck for approvals — monitor review queue length, add reviewer headcount at > 100 open items.'),
  bullet('Payment failure edge cases (NEFT/RTGS returns) — require manual reconciliation path in admin console.'),
  bullet('Modash (fake-follower %) is an external dependency — budget, fallback, or self-host a v2 heuristic.'),
  h2('11.2 Open Questions'),
  bullet('Does "5% platform margin" apply on top of the creator quote (shown to brand) or be deducted from creator payout? Assume shown to brand (as written in flow doc).'),
  bullet('Is the ₹999 "Get Your ROOM" a one-time unlock or recurring? Assume one-time for v1; reassess after 3 months.'),
  bullet('Creator withdrawal method — instant UPI vs. T+2 bank transfer? Decide before Phase 3.'),
  bullet('Who owns moderation of Feed content (user-generated memes/videos)? Ops vs. automated CV model.'),
  bullet('Tax handling for creator payouts — TDS under 194R / 194O? Confirm with finance before Phase 2 launch.'),
];

const appendix = [
  h1('12. Appendix — Glossary'),
  bulletRich([bold('Kalakaar: '), run('creator on the platform (Hindi for "artist").')]),
  bulletRich([bold('Your ROOM: '), run('brand\'s private campaign workspace, unlocked by paying ₹999.')]),
  bulletRich([bold('ER %: '), run('(Likes + Comments + Shares) / Reach × 100.')]),
  bulletRich([bold('CPV: '), run('cost per view — Cost / Average Views for a reel or story.')]),
  bulletRich([bold('Tier: '), run('Nano, Micro, Macro, Celebrity — classification by follower count.')]),
  bulletRich([bold('Ops / Execution: '), run('internal Kalakaarian team that reviews deliverables before payout.')]),
  bulletRich([bold('PWA: '), run('Progressive Web App — installable, offline-capable web application.')]),
];

// ---------- Document ----------

const doc = new Document({
  creator: 'Kalakaarian',
  title: 'Kalakaarian PRD v1.0',
  description: 'Product Requirements Document for Kalakaarian PWA',
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: FONT, color: '0B3954' },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: FONT, color: '1D4E77' },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: FONT, color: '2E75B6' },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ] },
      { reference: 'numbers',
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        ] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: 'Kalakaarian — PRD v1.0', font: FONT, size: 18, color: '777777' }),
            new TextRun({ text: '\t20 April 2026', font: FONT, size: 18, color: '777777' }),
          ],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'Page ', font: FONT, size: 18, color: '777777' }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: '777777' }),
            new TextRun({ text: ' of ', font: FONT, size: 18, color: '777777' }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 18, color: '777777' }),
          ],
        })],
      }),
    },
    children: [
      ...cover,
      ...execSummary,
      ...vision,
      ...personas,
      ...scope,
      ...sitemap,
      ...fr,
      ...nfr,
      ...arch,
      ...metrics,
      ...phasing,
      ...risks,
      ...appendix,
    ],
  }],
});

const outPath = path.join(__dirname, 'Kalakaarian_PRD_v1.docx');
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log('wrote', outPath, buf.length, 'bytes');
});
