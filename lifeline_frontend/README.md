# LifeLine Frontend

React (Vite) frontend for the LifeLine backend. Covers every use case built
so far: bilingual UI (English/Urdu), donor/patient/hospital registration,
donor and hospital dashboards, live chat, and Voice Mode.

This README covers frontend-only setup. **Read `../SETUP_GUIDE.md` first**
— it covers running the backend (which this depends on) and the full
combined startup sequence.

## Install

```bash
npm install
```

## Configure

```bash
copy .env.example .env      # Windows
cp .env.example .env        # macOS/Linux
```

Defaults assume the backend is running locally on `http://127.0.0.1:8000` —
no changes needed unless you've deployed the backend elsewhere.

## Run (development)

```bash
npm run dev
```

Opens on `http://localhost:5173` by default. The backend (all 4 terminals
from the Week 2-4 guide) must already be running, or every page will show
loading/error states.

## Build for production

```bash
npm run build
```

Outputs to `dist/`. Serve it with any static file host — it's a normal SPA
build, nothing backend-specific baked in beyond the `.env` values.

## Project structure

```
src/
├── api/client.js          JWT-aware fetch wrapper (auto-refresh on 401)
├── context/
│   ├── AuthContext.jsx     current user + login/logout
│   └── LanguageContext.jsx en/ur selection, persisted, sets RTL
├── i18n/strings.js        all UI text in both languages
├── components/
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   └── MatchCard.jsx       shared match card (confirm/cancel/call/chat)
└── pages/
    ├── LanguageSelect.jsx   FR-9.1: shown before anything else
    ├── Home.jsx
    ├── Login.jsx
    ├── RegisterDonor.jsx
    ├── RegisterPatient.jsx
    ├── RegisterHospital.jsx
    ├── VoiceRegister.jsx    FR-9.3-9.7: voice-guided registration
    ├── Dashboard.jsx        dispatches to the right dashboard by role
    ├── DonorDashboard.jsx
    ├── PatientDashboard.jsx
    ├── HospitalDashboard.jsx
    ├── HospitalDirectory.jsx  UC-5: public hospital list
    ├── HospitalDetail.jsx     UC-5: public hospital patient list
    └── ChatRoom.jsx            UC-7: WebSocket chat
```

## Known limitations (be aware before demoing)

- **Voice Mode covers a reduced field set.** The full donor eligibility
  checklist (8 yes/no medical questions) is NOT read aloud field-by-field —
  it defaults to "no" on all of them during voice registration, with a note
  telling the user to complete it properly from their dashboard afterward.
  Reading 8 medical yes/no questions aloud in sequence was judged too long
  for a usable voice flow; a real deployment should revisit this trade-off
  (SRS FR-9.5 does ask for every field, so this is a deliberate MVP scope
  cut worth discussing with your supervisor, not an oversight).
- **Password is always typed, never spoken**, even in Voice Mode — this is
  intentional (saying a password out loud is a real privacy/security risk
  in a public or semi-public space), not a bug.
- **CNIC image upload isn't wired up yet** — registration works without a
  photo; verification in Week 1-6 is done manually via Django admin either
  way, so this doesn't block anything, but a real deployment would need it.
- **No automated frontend test suite.** Every API call was verified against
  the real backend via a Python integration script during development, but
  there's no Jest/Vitest/Playwright suite in this deliverable — worth
  adding if you continue past Week 6.
