# LifeLine Backend — Weeks 2-4 Guide

Covers: the matching engine + broadcast (Week 2), real-time chat over
WebSockets (Week 3), and background jobs — donation confirmation, cooldown,
backup reassignment (Week 4). Read this alongside the Week 1 `README.md`,
which still covers the base setup (venv, migrations, Postman basics).

---

## 1. What's new in each week

### Week 2 — Matching engine (`matches` app)
- `matches/compatibility.py` — the ABO/Rh compatibility matrix + haversine
  distance function.
- `matches/services.py` — `find_matching_donors()` and
  `broadcast_match_for_request()`: filters donors by compatibility,
  verification, eligibility, availability, and travel radius.
- `matches/signals.py` — automatically broadcasts the moment a
  `PatientRequest` is created (individual **or** hospital path).
- `DonationMatch` model — one row per (donor, request) pair; the first donor
  to accept wins, others are kept as retained backups.
- New endpoints: donor's broadcast list, and accept (which is where the
  patient's contact info actually gets revealed — FR-3P.5).

### Week 3 — Real-time chat (`chat` app)
- `ChatMessage` model + REST history endpoint (for loading old messages).
- `chat/consumers.py` — the actual WebSocket handler, using Django Channels.
- `accounts/channels_auth.py` — since browsers can't attach an
  `Authorization` header to a WebSocket handshake, the same JWT access token
  gets passed as `?token=...` in the connection URL instead.
- Only the matched donor, the patient/requester, or that request's hospital
  staff can join a given chat room — checked before the connection is even
  accepted.

### Week 4 — Background jobs (`matches/tasks.py`)
- Donation confirmation now requires 2-of-3 agreement (donor / patient /
  hospital) before a match is marked complete — matches FR-6.1.
- On completion: donor cooldown (90 days) is set, units are decremented, and
  the request auto-reopens for broadcasting if units are still needed.
- `reassign_backup_donor` — a genuine Celery task, promotes the next-best
  backup donor if the assigned donor cancels.
- `reactivate_cooled_down_donors` — a nightly scheduled task (Celery Beat)
  that reactivates donors once their cooldown has passed.

---

## 2. New things you need installed

Week 1 only needed Python. From here on you also need **Redis** — it's the
message broker behind both the WebSocket chat (Channels) and the background
jobs (Celery).

### Installing Redis on Windows

You already have Docker Desktop installed (saw it in your PATH earlier), so
this is the easiest route — no separate Redis-for-Windows install needed:

```bash
docker run -d --name lifeline-redis -p 6379:6379 redis
```

Check it's running:
```bash
docker ps
```

You should see a container named `lifeline-redis`. Leave it running in the
background — you don't need a terminal open for it, Docker manages it.

**No Docker?** Alternative: install [Memurai](https://www.memurai.com/) (a
native Windows Redis-compatible server), or run Redis inside WSL2. Docker is
by far the least fiddly option if you already have it.

### New Python packages

Already added to `requirements.txt` — just re-run:
```bash
pip install -r requirements.txt
```

New additions: `channels`, `channels-redis`, `daphne` (Week 3), `celery`,
`redis` (Week 4).

---

## 3. Running everything (you now need multiple terminals)

Open **4 terminals** in VS Code (the `+` button in the terminal panel splits
them), all inside the project folder with `(venv)` activated
(`venv\Scripts\activate` in each one):

| Terminal | Command | What it's for |
|---|---|---|
| 1 | `python manage.py runserver` | REST API + WebSocket server (Channels replaces Django's dev server automatically once installed) |
| 2 | *(nothing — Redis runs in Docker in the background)* | just confirm `docker ps` shows it |
| 3 | `celery -A config worker --loglevel=info --pool=solo` | processes background jobs (donation confirmation side-effects, backup reassignment) |
| 4 | `celery -A config beat` | triggers the nightly cooldown-reactivation job on schedule |

**Windows note on Terminal 3**: `--pool=solo` is required on Windows — Celery's
default worker pool doesn't work there. Don't drop that flag.

You don't strictly need Terminal 4 running for day-to-day testing — it only
matters for the nightly reactivation job. Terminals 1 and 3 are what you'll
use constantly.

### What happens if you forget to start the Celery worker (Terminal 3)?

Nothing breaks catastrophically. `matches/services.py`'s `cancel_match()`
tries `.delay()` first (the proper async path); if that fails because no
worker/broker is reachable, it falls back to running the same logic
synchronously in the request itself. You'll still get correct behavior, just
without the "real" async processing — useful for quick testing, but for an
actual demo you want Terminal 3 running so it behaves like production.

---

## 4. Migrations

Two new apps were added (`matches`, `chat`), plus new fields on
`PatientRequest` (`latitude`, `longitude`). Run:

```bash
python manage.py makemigrations accounts donors hospitals patients matches chat
python manage.py migrate
```

---

## 5. Testing in Postman

Import `LifeLine_Week2-4.postman_collection.json` (same process as Week 1:
File → Import). It picks up where the Week 1 collection left off — run
Week 1's collection first if you haven't, since Week 2-4 requests depend on
donors/hospitals/patients already existing.

### What each new request proves

| Request | What it covers |
|---|---|
| Register 2nd donor (out of radius) | Confirms radius filtering excludes far-away donors |
| Donor: My Broadcasts | Confirms contact info is NOT visible pre-accept (FR-3P.5) |
| Donor: Accept Match | Confirms contact info IS revealed after accept, and the request status flips to `pending` |
| Confirm Donation (patient) | 1st of 2 confirmations — match should stay `accepted`, not auto-complete |
| Confirm Donation (donor) | 2nd confirmation — match auto-completes; donor cooldown + unit decrement happen |
| Cancel Match | Triggers backup reassignment — check the backup donor's match flips to `accepted` (may take a second if Celery is processing it asynchronously) |
| Chat History | REST endpoint — loads any messages sent so far in a match |

### Testing the WebSocket chat

Postman (v10+) supports WebSocket requests directly:

1. New → WebSocket Request.
2. URL: `ws://127.0.0.1:8000/ws/chat/<match_id>/?token=<your access token>`
   (get `<match_id>` from an accepted match, and `<your access token>` from
   a login response).
3. Connect, then send a message like `{"content": "hello"}` in the message box.
4. Open a **second** WebSocket connection (as the other party in the same
   match, using their own token) to see the message arrive live.

If you don't have Postman v10+, a quick browser-console alternative works
too — open any page's DevTools console and run:
```javascript
const ws = new WebSocket("ws://127.0.0.1:8000/ws/chat/1/?token=YOUR_ACCESS_TOKEN");
ws.onmessage = (e) => console.log("received:", e.data);
ws.onopen = () => ws.send(JSON.stringify({content: "hello from browser"}));
```

---

## 6. Things worth knowing (real issues hit while building this)

- **Celery's task autodiscovery can be unreliable with a lazy signal-based
  approach** — this project's `config/celery.py` uses
  `app.autodiscover_tasks(["matches"], force=True)` specifically because the
  default lazy discovery didn't reliably register tasks before the worker
  needed them. If you add a `tasks.py` to a new app later, add it to that
  list too.
- **Channels needs Redis even to run at all** — unlike Celery (which can at
  least degrade gracefully if you wrap `.delay()` calls), the WebSocket chat
  simply won't connect without Redis running, since `CHANNEL_LAYERS` is
  configured to use it directly for routing messages between connections.
- **A cancelled match's backup reassignment is genuinely asynchronous** once
  a real Celery worker is running — don't be surprised if checking the
  database immediately after calling `/cancel/` shows the old state; give it
  a second, or check via the API again shortly after.

---

## 7. What's still not built (later weeks)

- Real email/SMS notifications on broadcast (Week 5 — currently just
  creates DB rows a donor can query)
- Twilio masked calling (Week 5)
- Report/Block (Week 5)
- Voice Mode, Urdu i18n (Week 6)
- Frontend (React) — everything so far is backend/API only, tested via
  Postman and the Django admin
