I have an existing Next.js 14 + TypeScript + Tailwind CSS project called `bmrcl-platform` — 
a transit ticketing system for Namma Metro (BMRCL). Here is the current structure:

[PASTE YOUR PROJECT SUMMARY / FILE TREE HERE]

I want you to extend this project with the following features. Implement them in order, 
one phase at a time, and confirm completion before moving to the next.

---

## PHASE 1 — Landing Page Branding & Header

1. Add a sticky top navbar with:
   - BMRCL logo (SVG or img) on the left
   - Next to the logo, display the full form: "Bangalore Metro Rail Corporation Limited" 
     styled in BMRCL's brand colors (primary: #E63329 red, secondary: #1A3C6E navy blue)
   - Language switcher in the top-right corner with three options: English, हिन्दी, ಕನ್ನಡ
   - Selecting a language should update all UI text via a simple i18n context 
     (use a translations object with keys for all visible strings)

## PHASE 2 — Landing Page CTA + Footer

2. Below the navbar, on the landing/home page, add two large prominent CTA buttons:
   - "Check Trains" — clicking this opens a Train Info page showing all metro lines, 
     station list, inter-station distances, and fare chart (₹ based on distance slabs)
   - "Book Tickets" — clicking this routes to `/auth` (login/signup page)

3. Add a site footer with:
   - BMRCL copyright line
   - Quick links: About, Contact, Terms, Accessibility, RTI
   - App download badges (static placeholder images)
   - Social media icons (Twitter/X, Facebook, Instagram, YouTube)

## PHASE 3 — Auth: Login / Signup

4. Create `/auth` page with a tabbed Login / Sign Up form:
   - Sign Up: Name, Email, Phone, Password, Confirm Password
   - Login: Email/Phone + Password, with "Forgot Password" link
   - On success, store a mock user object in React Context / localStorage 
     (simulate auth — no real backend needed)
   - After login, redirect to `/dashboard`

## PHASE 4 — User Dashboard

5. Create `/dashboard` page (protected — redirect to `/auth` if not logged in):
   - Display user profile card: Name, Phone, Email, Metro Card Number (auto-generated)
   - Show linked E-Wallet balance prominently
   - Quick action buttons: Book Ticket, My Trips, E-Wallet, Notifications
   - If no account exists, show "Create Account" CTA that routes to `/auth?tab=signup`

## PHASE 5 — Ticket Booking Flow

6. After login, clicking "Book Ticket" opens the booking flow at `/book`:
   - Step 1 — Journey Details:
     - Source station dropdown (all 63 BMRCL stations)
     - Destination station dropdown
     - Travel date picker
     - Number of passengers (1–6)
     - On "Find Route" → run Dijkstra, show route, duration, fare per passenger, total fare
   - Step 2 — Confirm & Pay:
     - Show journey summary
     - Payment via E-Wallet (deduct from wallet balance) or "Add Money" if insufficient
     - On confirm → generate booking

## PHASE 6 — QR Ticket Generation

7. After booking confirmation, generate a QR code ticket at `/ticket/[bookingId]`:
   - QR code must encode: bookingId, fromStation, toStation, platform number, 
     date, time, numberOfPassengers, fareTotal, hmac signature
   - Display alongside QR: Station names, Platform number, Date & Time, 
     Number of passengers, Fare, Validity (24 hours from booking time)
   - Show a live countdown timer: "Valid for X hrs Y mins"
   - After 24 hours, QR visually expires (greyed out, "EXPIRED" overlay)
   - Use the existing `crypto-ticket.ts` HMAC-SHA256 signing logic

## PHASE 7 — Ticket Management (Pre-Scan)

8. On the ticket page, before the QR has been scanned, show two action buttons:
   - "Modify Ticket" — allows changing travel date/time or number of passengers 
     (station changes not allowed). Regenerates QR with updated details. 
     Fare difference is debited or refunded to E-Wallet.
   - "Cancel Ticket" — shows a confirmation modal with refund amount 
     (100% if >2 hrs before travel, 50% if <2 hrs). On confirm, 
     marks ticket as CANCELLED and credits refund to E-Wallet.
   - Both buttons disappear once QR scan is detected (simulate with a "Mark as Scanned" 
     button for demo purposes)

## PHASE 8 — Notifications & Alerts

9. Add a Notifications system:
   - Bell icon in navbar with unread badge count
   - Notifications panel (slide-in drawer or dropdown) with categorized alerts:
     - 🚆 Train Arriving — "Your train to Whitefield arrives at Platform 2 in 3 mins"
     - ⏱ Delay Alert — "Purple Line: 8-min delay near Baiyappanahalli due to signal issue"
     - 🚪 Door & Platform — "Train to MG Road: Board from Coach 3, doors open LEFT side"
     - 📢 General — Service announcements
   - Simulate 4–5 realistic notifications on page load using mock data
   - Mark as read on click; "Mark all as read" button

## PHASE 9 — E-Wallet

10. Create `/wallet` page:
    - Current balance displayed prominently
    - "Add Money" button → modal with preset amounts (₹100, ₹200, ₹500, ₹1000) 
      or custom input → simulates top-up
    - Full transaction history table with columns: Date, Description, Type (Debit/Credit), 
      Amount, Balance After
    - Transaction types include: Ticket Purchase (debit), Ticket Cancellation Refund (credit), 
      Manual Top-up (credit)
    - Filter by: All / Credits / Debits
    - Export as CSV button

---

## Technical Requirements

- Use Next.js 14 App Router with TypeScript throughout
- Use Tailwind CSS for all styling — follow BMRCL brand colors (#E63329, #1A3C6E, #FFFFFF)
- Reuse existing lib files: `metro-network.ts`, `crypto-ticket.ts`, `bloom-filter.ts`, 
  `event-sourcing.ts`, `gtfs-simulator.ts`
- All state management via React Context (already has `state-provider.tsx` — extend it)
- No real backend — simulate all data with mock objects and localStorage persistence
- i18n: implement a simple `useTranslation()` hook with English/Hindi/Kannada string maps
- QR code: use the `qrcode.react` npm package
- All new pages must be mobile-first responsive

Please implement Phase 1 first and show me the complete file changes before proceeding.