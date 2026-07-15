# LifeLine Backend — Week 1

Auth, roles, and the core models: Donor, Hospital, and PatientRequest (both
individual and hospital-added paths). This is the foundation the Week 2–6
work (matching, chat, background jobs, Twilio, voice mode) builds on top of.

---

## 1. Prerequisites

Install these once, globally, before opening the project:

- **Python 3.11 or 3.12** — check with `python3 --version`. Get it from
  [python.org](https://www.python.org/downloads/) if missing.
- **VS Code** — [code.visualstudio.com](https://code.visualstudio.com/)
- **VS Code Python extension** — open VS Code → Extensions (`Ctrl+Shift+X`) →
  search "Python" (by Microsoft) → Install.
- **Git** (optional but recommended) — for version control.

You do **not** need PostgreSQL installed for Week 1 — the project defaults
to SQLite so you can run it with zero database setup. Section 6 explains how
to switch to PostgreSQL later, matching the recommended production stack.

---

## 2. Open the project in VS Code

1. Unzip the project folder anywhere on your machine.
2. In VS Code: **File → Open Folder** → select the `lifeline_backend` folder.
3. Open a terminal inside VS Code: **Terminal → New Terminal** (or `` Ctrl+` ``).
   All commands below run in this terminal, from the project root.

---

## 3. Create a virtual environment and install dependencies

A virtual environment keeps this project's Python packages separate from
everything else on your machine — always use one.

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You'll know it worked when your terminal prompt shows `(venv)` at the start.

Then install every dependency in one go:
```bash
pip install -r requirements.txt
```

This installs:

| Package | Why |
|---|---|
| `Django` | Core web framework |
| `djangorestframework` | Builds the REST API |
| `djangorestframework-simplejwt` | JWT login/access/refresh tokens |
| `django-cors-headers` | Lets your React frontend call this API from a different port |
| `python-decouple` | Reads settings from `.env` instead of hardcoding secrets |
| `Pillow` | Required for `ImageField` (CNIC photo uploads) |
| `psycopg2-binary` | PostgreSQL driver — only used once you switch off SQLite |

**Tell VS Code to use this environment**: press `Ctrl+Shift+P` → "Python:
Select Interpreter" → choose the one inside `venv/` (e.g. `venv/bin/python`
or `venv\Scripts\python.exe`). This fixes import errors/red squiggly lines
in the editor.

---

## 4. Configure environment variables

```bash
cp .env.example .env        # macOS/Linux
copy .env.example .env      # Windows
```

The defaults in `.env` work out of the box (SQLite, debug mode on). You
don't need to edit anything to get started.

---

## 5. Run migrations and start the server

```bash
python manage.py makemigrations accounts donors hospitals patients
python manage.py migrate
python manage.py createsuperuser   # for /admin/ access — pick any username/password
python manage.py runserver
```

Open **http://127.0.0.1:8000/admin/** and log in with the superuser you just
created — this is where you'll manually verify donor CNICs and hospital
registrations in Week 1 (see Section 7).

Leave this terminal running. Open a **second** VS Code terminal (`+` icon in
the terminal panel) for any other commands while the server is up.

---

## 6. (Optional, later) Switching to PostgreSQL

Week 1 is fine on SQLite. When you're ready to match the recommended stack:

1. Install PostgreSQL locally, or use a free hosted instance (Railway, Render, Supabase).
2. Create a database and user.
3. In `.env`, set:
   ```
   DB_ENGINE=postgres
   DB_NAME=lifeline
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   ```
4. Delete `db.sqlite3` and re-run `python manage.py migrate`.

---

## 7. Manual verification workflow (Week 1 stand-in for Section 3.3A/3.1 of the SRS)

Real CNIC/hospital verification (OCR, document checks) is a later-phase
feature. For now, verification happens by hand in Django admin:

- **Donors**: `/admin/` → Donors → select a donor → **Actions → "Mark
  selected donors as CNIC-verified"**.
- **Hospitals**: `/admin/` → Hospitals → select a hospital → **Actions →
  "Verify selected hospitals"**. Only verified hospitals show up in the
  public `/api/hospitals/` directory (FR-3H.3).

---

## 8. Testing in Postman

1. Install [Postman](https://www.postman.com/downloads/).
2. Import `LifeLine_Week1.postman_collection.json` (File → Import → select the file).
3. Make sure `python manage.py runserver` is running first.
4. Run requests **in order, top to bottom** — later ones depend on tokens
   and IDs saved by earlier ones (handled automatically via collection
   variables, e.g. `{{donor_access}}`).

### What each request in the collection covers

| # | Request | What it proves |
|---|---|---|
| 1 | Register Donor | Full donor signup incl. eligibility checklist works end-to-end |
| 2 | Register Donor — Invalid CNIC | FR-1.2 CNIC format validation rejects bad input (expect 400) |
| 3 | Register Donor — Underweight | FR-2.3 auto-disqualification logic runs on signup |
| 4 | Login | JWT login returns a usable access token |
| 5 | Get Current User | `/me/` correctly identifies the logged-in role |
| 6 | Update Donor Profile | FR-2.4/2.5 availability toggle + radius setting work |
| 7 | Register Hospital | UC-3: hospital + first admin staff account created together, starts unverified |
| 8 | Register Individual Patient | UC-1: patient account + first request created together |
| 9 | Hospital Directory (pre-verify) | FR-3H.3: unverified hospitals are correctly hidden |
| 10 | *(manual step)* | Reminder to verify the hospital in `/admin/` before continuing |
| 11 | Hospital Directory (post-verify) | Verified hospital now appears publicly |
| 12 | Hospital Adds Patient | UC-4: hospital staff can add a patient request under their org |
| 13 | List My Hospital's Requests | Hospital dashboard query returns only that hospital's own data |
| 14 | Public Hospital Patient List | **FR-3P.5/3P.6**: confirms contact info and patient name are NOT exposed publicly |
| 15 | Cross-role access attempt | Confirms a patient token can't hit hospital-only endpoints (expect 403) |

If every request in the collection passes its built-in test (green "PASS"
in Postman's Test Results tab), Week 1 is solid and Week 2 (matching engine)
can build on top of it safely.

---

## 9. Project structure

```
lifeline_backend/
├── manage.py
├── requirements.txt
├── .env.example
├── config/            # settings, root urls, wsgi/asgi
├── accounts/          # custom User model, roles, CNIC validation, login/me
├── donors/            # Donor model, registration, profile
├── hospitals/         # Hospital + HospitalStaff models, registration, public directory
└── patients/          # PatientRequest model (both onboarding paths), registration, hospital CRUD
```

## 10. What's deliberately NOT in Week 1

These are scheduled for later weeks per the development plan — don't worry
if they're missing:
- Blood-group compatibility matching / broadcast to donors (Week 2)
- Chat, WebSockets (Week 3)
- Cooldown scheduling, donation confirmation, backup reassignment (Week 4)
- Email, Twilio masked calling, report/block (Week 5)
- Voice Mode, Urdu i18n, deployment (Week 6)
