import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import MatchCard from "../components/MatchCard";

const URGENCY_BADGE = { low: "badge-low", medium: "badge-medium", high: "badge-high", critical: "badge-critical" };

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
      <h1>{t("dashboard")}</h1>
      {error && <div className="error-box">{error}</div>}

      <h2>Your request(s)</h2>
      {requests.length === 0 && <p className="list-empty">No requests yet.</p>}
      {requests.map((r) => (
        <div className="card" key={r.id}>
          <p className="card-title">
            {r.blood_group} · {r.units_required} unit(s){" "}
            <span className={`badge ${URGENCY_BADGE[r.urgency_level] || ""}`}>{t(r.urgency_level)}</span>
          </p>
          <p className="card-meta">Status: {r.status} · {r.units_remaining} unit(s) still needed</p>
        </div>
      ))}

      {matches.length > 0 && (
        <>
          <h2>Matched donor(s)</h2>
          {matches.map((m) => <MatchCard key={m.id} match={m} role="patient" onChanged={loadAll} />)}
        </>
      )}
    </div>
  );
}
