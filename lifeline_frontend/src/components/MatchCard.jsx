import { Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { MessageCircle, Phone, CheckCircle, XCircle } from "lucide-react";

const URGENCY_BADGE = { low:"badge-low", medium:"badge-medium", high:"badge-high", critical:"badge-critical" };

export default function MatchCard({ match, role, onChanged }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const confirm = async () => {
    setBusy(true); setMsg(null);
    try {
      await api.post(`/api/matches/${match.id}/confirm/`);
      setMsg("Confirmation recorded. Thank you.");
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
    role === "donor"   ? match.donor_confirmed :
    role === "patient" ? match.patient_confirmed :
    match.hospital_confirmed;

  const statusColor = match.status === "accepted" ? "#58d68d" : match.status === "completed" ? "#5dade2" : "#888";

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:10 }}>
        <div>
          <p className="card-title" style={{ marginBottom:4 }}>
            {role === "donor" ? match.patient_name : `Donor: ${match.donor_username}`}{" "}
            <span className={`badge ${URGENCY_BADGE[match.urgency_level]||""}`}>{t(match.urgency_level)}</span>
          </p>
          <p className="card-meta" style={{ margin:0 }}>
            <strong style={{ color:"#C0392B" }}>{match.blood_group}</strong> · Status:{" "}
            <strong style={{ color:statusColor }}>{match.status}</strong>
          </p>
        </div>
        {/* Confirmation indicators */}
        <div style={{ display:"flex", gap:8 }}>
          {[
            [match.donor_confirmed,"Donor"],
            [match.patient_confirmed,"Patient"],
            [match.hospital_confirmed,"Hospital"],
          ].map(([confirmed,label])=>(
            <div key={label} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
              {confirmed
                ? <CheckCircle size={16} style={{ color:"#58d68d" }} />
                : <div style={{ width:16, height:16, borderRadius:"50%", border:"1px solid #333" }} />}
              <span style={{ fontSize:".6rem", color:"#555", textTransform:"uppercase" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact details */}
      {match.patient_contact && <p className="card-meta">📞 {match.patient_contact}</p>}
      {match.donor_phone && role !== "donor" && <p className="card-meta">📞 Donor: {match.donor_phone}</p>}
      {match.ward_location && <p className="card-meta">📍 {match.ward_location}</p>}

      {/* Feedback message */}
      {msg && (
        <div className={msg.includes("ancel")||msg.includes("ouldn") ? "error-box" : "success-box"} style={{ marginTop:10, fontSize:".85rem" }}>
          {msg}
        </div>
      )}

      {/* Actions */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:14 }}>
        <Link to={`/chat/${match.id}`}>
          <button className="btn btn-outline btn-sm" style={{ display:"flex", alignItems:"center", gap:5 }}>
            <MessageCircle size={13}/> {t("chat")}
          </button>
        </Link>

        {match.status === "accepted" && !myConfirmed && (
          <button className="btn btn-sm" disabled={busy} onClick={confirm} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <CheckCircle size={13}/> {t("confirmDonation")}
          </button>
        )}

        {match.status === "accepted" && (match.urgency_level === "high" || match.urgency_level === "critical") && (
          <button className="btn btn-sm btn-outline" disabled={busy} onClick={callNow} style={{ display:"flex", alignItems:"center", gap:5, borderColor:"rgba(230,126,34,.5)", color:"#e67e22" }}>
            <Phone size={13}/> {t("callNow")}
          </button>
        )}

        {role === "donor" && match.status === "accepted" && (
          <button className="btn btn-sm btn-danger-outline" disabled={busy} onClick={cancel} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <XCircle size={13}/> {t("cancelMatch")}
          </button>
        )}
      </div>
    </div>
  );
}
