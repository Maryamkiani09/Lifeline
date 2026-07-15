import { Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

const URGENCY_BADGE = { low: "badge-low", medium: "badge-medium", high: "badge-high", critical: "badge-critical" };

export default function MatchCard({ match, role, onChanged }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const confirm = async () => {
    setBusy(true); setMsg(null);
    try {
      await api.post(`/api/matches/${match.id}/confirm/`);
      setMsg("Confirmation recorded.");
      onChanged?.();
    } catch (err) {
      setMsg(err.data?.detail || "Couldn't confirm.");
    } finally { setBusy(false); }
  };

  const cancel = async () => {
    setBusy(true); setMsg(null);
    try {
      await api.post(`/api/matches/${match.id}/cancel/`);
      setMsg("Cancelled — looking for a backup donor.");
      onChanged?.();
    } catch (err) {
      setMsg(err.data?.detail || "Couldn't cancel.");
    } finally { setBusy(false); }
  };

  const callNow = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await api.post(`/api/matches/${match.id}/call-now/`);
      setMsg(res.detail);
    } catch (err) {
      setMsg(err.data?.detail || "Couldn't set up masked call.");
    } finally { setBusy(false); }
  };

  const myConfirmed =
    role === "donor" ? match.donor_confirmed :
    role === "patient" ? match.patient_confirmed :
    match.hospital_confirmed;

  return (
    <div className="card">
      <p className="card-title">
        {role === "donor" ? match.patient_name : `Donor: ${match.donor_username}`}{" "}
        <span className={`badge ${URGENCY_BADGE[match.urgency_level] || ""}`}>{t(match.urgency_level)}</span>
      </p>
      <p className="card-meta">{match.blood_group} · status: {match.status}</p>
      {match.patient_contact && <p className="card-meta">📞 {match.patient_contact}</p>}
      {match.donor_phone && role !== "donor" && <p className="card-meta">📞 donor: {match.donor_phone}</p>}
      {match.ward_location && <p className="card-meta">📍 {match.ward_location}</p>}

      <p className="card-meta">
        Confirmations: donor {match.donor_confirmed ? "✅" : "—"} · patient {match.patient_confirmed ? "✅" : "—"} · hospital {match.hospital_confirmed ? "✅" : "—"}
      </p>

      {msg && <div className="info-box" style={{ marginTop: 8 }}>{msg}</div>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <Link to={`/chat/${match.id}`}><button className="btn btn-sm btn-outline">{t("chat")}</button></Link>

        {match.status === "accepted" && !myConfirmed && (
          <button className="btn btn-sm" disabled={busy} onClick={confirm}>{t("confirmDonation")}</button>
        )}
        {match.status === "accepted" && (match.urgency_level === "high" || match.urgency_level === "critical") && (
          <button className="btn btn-sm btn-outline" disabled={busy} onClick={callNow}>{t("callNow")}</button>
        )}
        {role === "donor" && match.status === "accepted" && (
          <button className="btn btn-sm btn-danger-outline" disabled={busy} onClick={cancel}>{t("cancelMatch")}</button>
        )}
      </div>
    </div>
  );
}
