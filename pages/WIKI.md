# Graceful Hands Therapeutic Massage Repository Wiki

This wiki explains how the Graceful Hands Therapeutic Massage app is organized, how to run it, where key features live, and what to watch when maintaining it.

## Project Overview

Graceful Hands Therapeutic Massage is a Vite, React, and TypeScript single page application for a therapeutic massage practice in Edmonton, Alberta.

The app includes:

- Public marketing pages for home, services, about, policies, and booking.
- A multi-step booking flow with service, duration, date, time, intake, and contact details.
- A protected admin area for appointments, leads, messages, services, and site settings.
- Local browser persistence through `localStorage`.
- Formspree notifications for contact, lead, and booking submissions.
- Rachel, an AI receptionist powered by Gemini text chat.
- Rachel voice assistant powered by Vapi.

## Quick Start

### Prerequisites

- Node.js
- npm
- A Gemini API key for Rachel chat features

### Install

```bash
npm install
```

### Environment

Create `.env.local` in the repository root:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

The Vite config exposes this value to the browser as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.

### Development

```bash
npm run dev
```

The dev server is configured for port `3000`.

### Production Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router with `HashRouter`
- Tailwind via CDN in `index.html`
- Lucide React icons
- Recharts for admin dashboard charts
- Google GenAI SDK for Rachel chat
- Vapi Web SDK for Rachel voice
- Formspree for email-style form submissions
- Browser `localStorage` for app data

## Repository Map

```text
.
|-- App.tsx
|-- index.tsx
|-- index.html
|-- constants.tsx
|-- types.ts
|-- vite.config.ts
|-- lib/
|   `-- db.ts
|-- components/
|   |-- Navbar.tsx
|   |-- Footer.tsx
|   |-- RachelChat.tsx
|   |-- VoiceAssistant.tsx
|   `-- BookingReviewModal.tsx
`-- pages/
    |-- Home.tsx
    |-- Services.tsx
    |-- Booking.tsx
    |-- About.tsx
    |-- Policies.tsx
    |-- Login.tsx
    |-- Admin.tsx
    `-- WIKI.md
```

## Routing

Routes are defined in `App.tsx` and rendered through `HashRouter`.

| Route | Component | Purpose |
| --- | --- | --- |
| `/` | `pages/Home.tsx` | Landing page, featured services, contact form, voice assistant entry |
| `/services` | `pages/Services.tsx` | Full service menu and add-ons |
| `/booking` | `pages/Booking.tsx` | Multi-step booking flow |
| `/about` | `pages/About.tsx` | Business story, values, team profile |
| `/policies` | `pages/Policies.tsx` | Booking, privacy, cancellation, and clinic policies |
| `/login` | `pages/Login.tsx` | Admin login form |
| `/admin/*` | `pages/Admin.tsx` | Protected admin dashboard and management views |

The admin route uses `ProtectedRoute` in `App.tsx`, which checks `db.isAuthenticated()`.

## Shared Constants

Most public-facing business content starts in `constants.tsx`.

Important exports:

- `COLORS`: brand color defaults.
- `CONTACT_INFO`: phone, email, address, Instagram URL, tagline, and Formspree endpoint.
- `SERVICES`: service catalog, pricing, categories, duration options, and images.
- `ADD_ONS`: optional booking add-ons.
- `TESTIMONIALS`: homepage testimonials.
- `TEAM`: therapist profile content.

When changing pricing or service names, check both `constants.tsx` and any AI prompts in `components/RachelChat.tsx` and `components/VoiceAssistant.tsx`. The AI prompts currently duplicate service and pricing text.

## Data Model

Core TypeScript interfaces live in `types.ts`.

| Type | Purpose |
| --- | --- |
| `Service` | Massage service, image, category, duration options, and prices |
| `AddOn` | Optional add-on with price |
| `SiteSettings` | Dynamic site color and metadata settings |
| `Appointment` | Booking record with client, service, time, status, intake details, and total |
| `ContactMessage` | Contact form message |
| `Testimonial` | Client review content |
| `Staff` | Team member profile |
| `Lead` | Sales or booking lead captured through AI chat or voice flows |

## Local Persistence

`lib/db.ts` provides a small browser database wrapper around `localStorage`.

Storage keys:

| Key | Data |
| --- | --- |
| `gh_services` | Editable services |
| `gh_appointments` | Bookings |
| `gh_settings` | Site settings |
| `gh_messages` | Contact messages |
| `gh_leads` | Lead records |
| `gh_session` | Admin login session flag |

Important behavior:

- If no saved services exist, `db.getServices()` falls back to `SERVICES` from `constants.tsx`.
- Settings are applied to CSS variables `--primary-color` and `--secondary-color`.
- Appointment availability excludes pending and confirmed appointments.
- Sunday is closed in `db.getAvailableSlots()`.
- The admin login is a hard-coded client-side passcode in `lib/db.ts`, so it should be treated as demo-level access control only.

## Booking Flow

Primary file: `pages/Booking.tsx`

The booking page manages:

- Service and duration selection.
- Calendar month navigation.
- Availability indicators for dates.
- Time slot selection.
- Intake fields for pressure, focus areas, and medical notes.
- Contact details.
- Final submission.

On final submit:

- A booking payload is sent to Formspree.
- The appointment is saved through `db.addAppointment()`.
- The appointment status starts as `Pending`.
- The user is navigated to a confirmation-style state.

Note: `Booking.tsx` has its own `getSlotsForDate()` implementation. `lib/db.ts` also has `getAvailableSlots()`. If business hours or conflict rules change, update both places or consolidate into one shared helper.

## Admin Area

Primary file: `pages/Admin.tsx`

Admin subroutes:

| Admin Route | Section |
| --- | --- |
| `/admin` | Dashboard overview |
| `/admin/bookings` | Appointment status management |
| `/admin/leads` | Lead status management |
| `/admin/services` | Service add/edit/delete, image upload |
| `/admin/messages` | Contact messages |
| `/admin/settings` | Brand colors, metadata, social links, announcement bar |

Appointment statuses:

- `Pending`
- `Confirmed`
- `Cancelled`
- `Completed`

Lead statuses:

- `New`
- `Contacted`
- `Booked`
- `Lost`

Because the admin tools use `localStorage`, records are stored only in the current browser unless a real backend is added.

## AI Receptionist Chat

Primary file: `components/RachelChat.tsx`

Rachel chat uses `@google/genai` with the `gemini-2.0-flash` model and function declarations.

Tools exposed to the model:

- `checkAvailability`: checks slots through `db.getAvailableSlots()`.
- `bookAppointment`: creates a confirmed appointment, creates a booked lead, and sends Formspree notification.
- `logLead`: creates a lead without a confirmed booking.

Operational notes:

- Requires `GEMINI_API_KEY`.
- The system prompt includes business hours, service pricing, booking rules, and safety boundaries.
- Rachel must check availability before booking.
- Successful AI bookings are stored as `Confirmed`.
- If the API call fails, the UI directs clients to call the business.

## Voice Assistant

Primary file: `components/VoiceAssistant.tsx`

The voice assistant uses `@vapi-ai/web` with:

- Deepgram transcription.
- OpenAI model configuration through Vapi.
- OpenAI voice configuration through Vapi.
- A Vapi public key embedded in the component.

The voice flow collects a lightweight booking summary and can pass it back to `Home.tsx` through `onBookingCollected()`.

Operational notes:

- Browser microphone permission is required.
- Errors are surfaced in the modal with a retry option.
- The current implementation is mostly a guided voice receptionist experience. Full booking persistence happens through the chat and booking page flows.

## Forms And Notifications

Formspree endpoint is configured in `CONTACT_INFO.formspreeEndpoint`.

Used by:

- `pages/Home.tsx` contact form.
- `pages/Home.tsx` voice summary lead submission.
- `pages/Booking.tsx` final booking submission.
- `components/RachelChat.tsx` AI booking notification.

If the Formspree endpoint changes, update `constants.tsx`.

## Styling And Branding

Global styling is in `index.html`.

The app uses:

- Tailwind CDN utilities.
- Playfair Display for headings and serif accents.
- Montserrat for body text.
- CSS variables for primary and secondary brand colors.

Default brand colors:

- Primary: `#2D4F3E`
- Secondary: `#D4AF37`
- Background: `#FCF9F5`

Admin settings can update primary and secondary colors at runtime by saving to `localStorage` and updating document CSS variables.

## Common Maintenance Tasks

### Change Contact Details

Edit `CONTACT_INFO` in `constants.tsx`.

Check:

- Footer
- Home contact section
- AI chat prompt
- Voice assistant prompt
- Formspree submissions

### Change Services Or Pricing

Edit `SERVICES` and `ADD_ONS` in `constants.tsx`.

Then check:

- `pages/Services.tsx`
- `pages/Booking.tsx`
- `components/RachelChat.tsx`
- `components/VoiceAssistant.tsx`

If services were already edited in the admin UI, the browser may continue using `gh_services` from `localStorage`. Clear that key or use the admin service manager.

### Change Business Hours

Update:

- `lib/db.ts` in `getAvailableSlots()`
- `pages/Booking.tsx` in `getSlotsForDate()`
- Rachel chat prompt in `components/RachelChat.tsx`
- Rachel voice prompt in `components/VoiceAssistant.tsx`
- Any visible policy or footer copy, if applicable

### Reset Local App Data

In the browser console:

```js
localStorage.removeItem('gh_services');
localStorage.removeItem('gh_appointments');
localStorage.removeItem('gh_settings');
localStorage.removeItem('gh_messages');
localStorage.removeItem('gh_leads');
localStorage.removeItem('gh_session');
```

To wipe everything for this site:

```js
localStorage.clear();
```

### Update Admin Access

The current admin access check is client-side and hard-coded in `lib/db.ts`.

For production, replace it with server-backed authentication before storing real client records.

## Known Limitations

- Data is stored in browser `localStorage`, not a shared database.
- Admin auth is client-side and should not protect sensitive production data.
- Service and pricing information is duplicated in constants and AI prompts.
- Booking availability logic exists in both `lib/db.ts` and `pages/Booking.tsx`.
- Formspree submission failures do not always block local booking creation.
- There is no automated test suite configured.
- Tailwind is loaded from CDN instead of a local build pipeline.

## Suggested Next Improvements

- Move appointments, leads, services, and settings to a backend database.
- Replace client-side admin passcode with real authentication.
- Consolidate booking availability logic into one shared module.
- Generate Rachel prompts from `SERVICES`, `ADD_ONS`, and business hours constants.
- Add validation tests for booking conflicts and unavailable days.
- Add smoke tests for the booking and admin flows.
- Move Tailwind into the Vite build for production consistency.
