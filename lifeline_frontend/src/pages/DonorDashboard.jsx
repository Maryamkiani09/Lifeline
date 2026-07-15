import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import MatchCard from "../components/MatchCard";

const URGENCY_BADGE = { low: "badge-low", medium: "badge-medium", high: "badge-high", critical: "badge-critical" };

export default function DonorDashboard() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [broadcasts, setBroadcasts] = useState([]);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);
  const [acceptBusyId, setAcceptBusyId] = useState(null);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [p, b, m] = await Promise.all([
        api.get("/api/donors/me/"),
        api.get("/api/matches/my-broadcasts/"),
        api.get("/api/matches/my-matches/"),
      ]);
      setProfile(p); setBroadcasts(b); setMatches(m);
    } catch (err) {
      setError(err.data?.detail || "Couldn't load your dashboard.");
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const toggleAvailable = async () => {
    const updated = await api.patch("/api/donors/me/", { is_available: !profile.is_available });
    setProfile(updated);
  };

  const accept = async (matchId) => {
    setAcceptBusyId(matchId);
    try {
      await api.post(`/api/matches/${matchId}/accept/`);
      await loadAll();
    } catch (err) {
      setError(err.data?.detail || "This request was just taken by another donor.");
    } finally {
      setAcceptBusyId(null);
    }
  };

  if (!profile) return <div className="page">{error ? <div className="error-box">{error}</div> : t("loadingText")}</div>;

  return (
    <div className="page">
      <h1>{t("dashboard")}</h1>

      <div className="card">
        <p className="card-title">{profile.username}</p>
        <p className="card-meta">Blood group: {profile.blood_group} · Status: {profile.status}</p>
        <p className="card-meta">Verified: {profile.is_cnic_verified ? "✅ Yes" : "⏳ Pending admin verification"}</p>
        {profile.status === "cooling_down" && (
          <p className="card-meta">Cooldown until: {profile.next_eligible_date}</p>
        )}
        <p className="card-meta">Total donations: {profile.donation_count}</p>
        <label className="checkbox-row" style={{ marginTop: 10 }}>
          <input type="checkbox" checked={profile.is_available} onChange={toggleAvailable} />
          {t("availableToggle")}
        </label>
      </div>

      {error && <div className="error-box">{error}</div>}

      <h2>{t("myBroadcasts")}</h2>
      {broadcasts.length === 0 && <p className="list-empty">{t("noBroadcasts")}</p>}
      {broadcasts.map((b) => (
        <div className="card" key={b.id}>
          <p className="card-title">
            {b.blood_group} needed{" "}
            <span className={`badge ${URGENCY_BADGE[b.urgency_level] || ""}`}>{t(b.urgency_level)}</span>
          </p>
          <p className="card-meta">{b.units_required} unit(s) required, {b.units_remaining} remaining</p>
          <p className="card-meta">{b.hospital_name} {b.ward_location && `· ${b.ward_location}`}</p>
          {b.distance_km != null && <p className="card-meta">~{b.distance_km.toFixed(1)} km away</p>}
          <button className="btn btn-sm btn-red" disabled={acceptBusyId === b.id} onClick={() => accept(b.id)}>
            {acceptBusyId === b.id ? t("loadingText") : t("accept")}
          </button>
        </div>
      ))}

      {matches.length > 0 && (
        <>
          <h2>Active / past matches</h2>
          {matches.map((m) => <MatchCard key={m.id} match={m} role="donor" onChanged={loadAll} />)}
        </>
      )}
    </div>
  );
}
