import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import MatchCard from "../components/MatchCard";
import { Droplet, Activity } from "lucide-react";

const URGENCY_BADGE = { low:"badge-low", medium:"badge-medium", high:"badge-high", critical:"badge-critical" };

export default function PatientDashboard() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [r, m] = await Promise.all([
        api.get("/api/patients/my-requests/"),
        api.get("/api/matches/my-matches/"),
      ]);
      setRequests(r); setMatches(m);
    } catch (err) {
      setError(err.data?.detail || "Couldn't load your dashboard.");
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <div className="page">
      <h1 style={{ marginBottom:4 }}>{t("dashboard")}</h1>
      <p className="subtitle" style={{ color:"#C0392B", fontFamily:"'Oswald',sans-serif", letterSpacing:".08em" }}>
        PATIENT PORTAL
      </p>

      {error && <div className="error-box">{error}</div>}

      <h2>Your Blood Request(s)</h2>
      {requests.length === 0 && (
        <p className="list-empty">No requests yet. <a href="/register/patient">Post a blood request →</a></p>
      )}
      {requests.map((r) => (
        <div className="card" key={r.id}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
            <div>
              <p className="card-title">
                <strong style={{ color:"#C0392B" }}>{r.blood_group}</strong> · {r.units_required} unit(s){" "}
                <span className={`badge ${URGENCY_BADGE[r.urgency_level]||""}`}>{t(r.urgency_level)}</span>
              </p>
              <p className="card-meta">
                Status: <strong style={{ color: r.status === "open" ? "#58d68d" : "#888" }}>{r.status}</strong>
                {" "}· {r.units_remaining} unit(s) still needed
              </p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <Activity size={14} style={{ color:"#C0392B" }} />
              <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:".8rem", color:"#888", letterSpacing:".08em", textTransform:"uppercase" }}>
                {r.status}
              </span>
            </div>
          </div>
        </div>
      ))}

      {matches.length > 0 && (
        <>
          <h2>Matched Donor(s)</h2>
          {matches.map((m) => <MatchCard key={m.id} match={m} role="patient" onChanged={loadAll} />)}
        </>
      )}
    </div>
  );
}
