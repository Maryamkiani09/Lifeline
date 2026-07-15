# LifeLine — Full Stack Setup Guide (Weeks 1-6)

This covers running the complete project: Django backend + React frontend,
including everything added in Weeks 5-6 (email, masked calling, report/
block, Docker Compose, and the frontend itself). Read this top to bottom
once — after that, Section 6 ("Daily startup") is all you'll need.

If you haven't already, read `lifeline_backend/README.md` (Week 1 basics)
and `lifeline_backend/WEEK_2_3_4_GUIDE.md` (matching, chat, background jobs)
first — this guide assumes that context and doesn't repeat it.

---

## 1. What's new in Weeks 5-6

### Week 5 — backend (`lifeline_backend`)
- **Email notifications** (`matches/tasks.py`): donors get an email when a
  matching request is broadcast to them; patients get an email when a donor
  accepts (FR-5.2). Defaults to printing emails to the console — zero setup.
- **Masked calling** (`matches/twilio_service.py`): `POST
  /api/matches/<id>/call-now/` sets up a Twilio Proxy session so donor and
  patient can call each other without exposing real numbers, for High/
  Critical urgency accepted matches. Without Twilio credentials configured,
  it returns a clear "not configured" response instead of crashing.
- **Report/Block** (`safety` app): `POST /api/safety/report/`, `GET/POST
  /api/safety/blocks/`. A donor accumulating 3+ pending reports is
  automatically suspended from matching (FR-8.2).
- **`docker-compose.yml`**: runs the entire backend stack (web, Redis,
  Celery worker, Celery beat) with one command — see Section 4.

### Week 6 — frontend (`lifeline_frontend`)
A full React app: language selection, donor/patient/hospital registration,
role-specific dashboards, live chat, and Voice Mode (FR-9.1-9.7). See
`lifeline_frontend/README.md` for its structure.

---

## 2. One-time setup

### Backend
```bash
cd lifeline_backend
python -m venv venv
venv\Scripts\activate          # Windows; use `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
copy .env.example .env         # Windows; `cp` on macOS/Linux
python manage.py makemigrations accounts donors hospitals patients matches chat safety
python manage.py migrate
python manage.py createsuperuser
```

### Frontend
```bash
cd lifeline_frontend
npm install
copy .env.example .env         # Windows; `cp` on macOS/Linux
```

---

## 3. Configuring Week 5 features (optional — everything works without this)

Both features degrade gracefully if left unconfigured, so you can skip this
section entirely for local development/demos and come back to it later.

### Real email (instead of console printing)
In `lifeline_backend/.env`:
```
EMAIL_BACKEND=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_address@gmail.com
EMAIL_HOST_PASSWORD=your_16_char_app_password
```
For Gmail specifically, you need an **App Password** (not your normal
password) — generate one at https://myaccount.google.com/apppasswords
(requires 2-Step Verification enabled on the account first).

### Real masked calling (Twilio)
1. Create a free Twilio trial account at twilio.com.
2. Create a **Proxy Service** in the Twilio console (Develop → Proxy →
   Services → Create new Service).
3. In `lifeline_backend/.env`:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PROXY_SERVICE_SID=KSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Twilio trial accounts can only call/text verified numbers — fine for
testing, but know that going live needs a paid account.

---

## 4. Running everything

You have two options. **Option A (native, multi-terminal)** is what you've
been doing since Week 2-4 — more terminals, but easier to see what's
happening and to debug. **Option B (Docker Compose)** is simpler to start
but harder to peek inside — good once you trust the setup.

### Option A — native (5 terminals total)

| # | Location | Command |
|---|---|---|
| 1 | `lifeline_backend` | `python manage.py runserver` |
| 2 | *(Docker, backgrounded)* | `docker run -d -p 6379:6379 redis` (once — leave it running) |
| 3 | `lifeline_backend` | `celery -A config worker --loglevel=info --pool=solo` |
| 4 | `lifeline_backend` | `celery -A config beat` |
| 5 | `lifeline_frontend` | `npm run dev` |

Then open `http://localhost:5173` in your browser.

### Option B — Docker Compose (backend only; frontend still runs natively)

```bash
cd lifeline_backend
docker compose up --build
```

This starts web + redis + celery worker + celery beat together. You'll
still run the frontend separately (`npm run dev` in `lifeline_frontend`) —
Docker Compose here only covers the backend, since Vite's dev server with
hot-reload is more convenient to run natively while you're still building.

**Honesty note**: this `docker-compose.yml` was written carefully and
should work, but wasn't able to be tested in the environment this project
was built in (no Docker available there). If you hit issues with it,
Option A (native) is the proven-working path — fall back to that and let's
debug Docker Compose separately if you want it working.

---

## 5. First-time data setup (do this once per fresh database)

1. Go to `http://127.0.0.1:8000/admin/`, log in with your superuser.
2. Register a donor and a hospital through the frontend (`http://localhost:5173`).
3. In Django admin: **Donors** → select your test donor → run "Mark
   selected donors as CNIC-verified".
4. In Django admin: **Hospitals** → select your test hospital → run "Verify
   selected hospitals".
5. Now register a patient request (individual or via the hospital
   dashboard) — you should see it broadcast to your verified donor, visible
   on their dashboard within seconds.

---

## 6. Daily startup (once everything's configured)

```bash
# Terminal 1
cd lifeline_backend && venv\Scripts\activate && python manage.py runserver

# Terminal 2 (if not already running in the background)
docker start lifeline-redis   # or: docker run -d --name lifeline-redis -p 6379:6379 redis

# Terminal 3
cd lifeline_backend && venv\Scripts\activate && celery -A config worker --loglevel=info --pool=solo

# Terminal 4
cd lifeline_backend && venv\Scripts\activate && celery -A config beat

# Terminal 5
cd lifeline_frontend && npm run dev
```

Browse to `http://localhost:5173`.

---

## 7. Testing the new Week 5 features

### Report/Block + auto-suspension
Report the same donor 3 times from 3 different patient accounts (or the
same one, 3 separate `POST /api/safety/report/` calls) — check Django
admin → Donors, the donor's `is_suspended` should flip to `True`, and they
should stop appearing in new broadcasts.

### Masked calling
Accept a **High** or **Critical** urgency match, then click "Call now" on
either dashboard. Without Twilio configured, you'll see the graceful
"not configured" message rather than an error — that's expected and correct
behavior, not a bug.

### Email
Check Terminal 1's console output after any broadcast or accept — with the
default console backend, the full email content prints right there.

---

## 8. Testing Voice Mode

1. Open the app in **Chrome or Edge** (Firefox doesn't support the Web
   Speech API used here).
2. From the language screen, tap "Can't read or see the screen? Tap here
   for Voice Mode".
3. Allow microphone access when the browser prompts.
4. Follow the spoken prompts — tap the microphone button, speak your
   answer, then confirm "yes" or "no" when it reads back what it heard.
   You can type into the text box instead of speaking at any step.

If speech recognition isn't working, check: microphone permission granted,
using Chrome/Edge (not Firefox/Safari), and that you're on `localhost` or
`https://` (browsers block microphone access on plain `http://` for
anything except localhost).

---

## 9. Full project structure

```
LifeLine_Project/
├── SETUP_GUIDE.md              (this file)
├── lifeline_backend/
│   ├── README.md                Week 1 setup
│   ├── WEEK_2_3_4_GUIDE.md       Week 2-4 setup
│   ├── LifeLine_Week1.postman_collection.json
│   ├── LifeLine_Week2-4.postman_collection.json
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── accounts/ donors/ hospitals/ patients/ matches/ chat/ safety/
│   └── config/
└── lifeline_frontend/
    ├── README.md
    └── src/
```

## 10. What's genuinely NOT done, even now

- Automated frontend tests (see frontend README)
- CNIC image upload wiring in the frontend (backend supports it, form doesn't send it yet)
- PostGIS / production-grade geo queries (still haversine-in-Python, fine at this scale)
- Production deployment configs (HTTPS, real domain, environment secrets management) — this is a local-dev/demo-ready setup, not a production one
- NADRA-style automated CNIC verification — still manual via Django admin
