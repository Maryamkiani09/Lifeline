"""
FR-5.3/5.4: for High/Critical urgency, connect donor and patient by phone
WITHOUT revealing either party's real number, using Twilio Proxy.

This intentionally does NOT have the platform auto-dial the patient (see the
SRS Section 7 design note on why) — it sets up a masked session and returns
a proxy number each party can call/text that forwards to the other side.

Requires a real Twilio account (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) and a
Proxy Service (TWILIO_PROXY_SERVICE_SID) configured in the Twilio console.
Without those, this degrades to a clear "not configured" response instead of
crashing — see is_configured() below.
"""
from django.conf import settings


def is_configured():
    return bool(
        settings.TWILIO_ACCOUNT_SID
        and settings.TWILIO_AUTH_TOKEN
        and settings.TWILIO_PROXY_SERVICE_SID
    )


def create_masked_call_session(donor_phone: str, patient_phone: str, unique_name: str):
    """
    Creates a Twilio Proxy Session with both participants. Each participant
    gets a proxy number; calling/texting it relays to the other party without
    exposing either real number. Returns a dict describing the session, or
    a not-configured explanation if Twilio credentials aren't set.
    """
    if not is_configured():
        return {
            "configured": False,
            "detail": (
                "Twilio isn't configured on this server yet. Add "
                "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and "
                "TWILIO_PROXY_SERVICE_SID to .env to enable masked calling. "
                "Until then, coordinate via chat."
            ),
        }

    from twilio.rest import Client

    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    proxy_service = client.proxy.v1.services(settings.TWILIO_PROXY_SERVICE_SID)

    session = proxy_service.sessions.create(unique_name=unique_name)
    proxy_service.sessions(session.sid).participants.create(
        friendly_name="donor", voice=True, identifier=donor_phone
    )
    proxy_service.sessions(session.sid).participants.create(
        friendly_name="patient", voice=True, identifier=patient_phone
    )

    return {
        "configured": True,
        "session_sid": session.sid,
        "detail": "Masked call session created. Both parties can now call each other through their normal dialer — the call will connect via Twilio without exposing either real number.",
    }
