import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import MatchCard from "../components/MatchCard";
import { Droplet, Activity, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";

const URGENCY_BADGE = { low:"badge-low", medium:"badge-medium", high:"badge-high", critical:"badge-critical" };

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

  if (!profile) return (
    <div className="page" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
      {error ? <div className="error-box">{error}</div> : (
        <div style={{ textAlign:"center" }}>
          <Droplet size={36} style={{ color:"#C0392B", fill:"#C0392B" }} className="pulse-drop" />
          <p style={{ color:"#555", marginTop:12 }}>{t("loadingText")}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="page">
      <h1 style={{ marginBottom:4 }}>{t("dashboard")}</h1>
      <p className="subtitle" style={{ color:"#C0392B", fontFamily:"'Oswald',sans-serif", letterSpacing:".08em" }}>
        DONOR PORTAL
      </p>

      {/* Profile Card */}
      <div className="card" style={{ borderColor: profile.is_available ? "rgba(39,174,96,.4)" : "#2a2a2a" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
              <div style={{ width:40, height:40, borderRadius:"50%", background:"rgba(192,57,43,.15)", border:"1px solid rgba(192,57,43,.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Droplet size={18} style={{ color:"#C0392B", fill:"#C0392B" }} />
              </div>
              <div>
                <p className="card-title">{profile.username}</p>
                <p className="card-meta" style={{ margin:0 }}>Blood Group: <strong style={{ color:"#C0392B" }}>{profile.blood_group}</strong> · Status: <strong style={{ color: profile.status === "available" ? "#58d68d" : "#888" }}>{profile.status}</strong></p>
              </div>
            </div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginTop:6 }}>
              <span className="card-meta">
                <ShieldCheck size={12} style={{ display:"inline", marginRight:4, color: profile.is_cnic_verified ? "#58d68d" : "#888" }} />
                {profile.is_cnic_verified ? "CNIC Verified ✓" : "Verification Pending"}
              </span>
              <span className="card-meta"><Activity size={12} style={{ display:"inline", marginRight:4 }} />{profile.donation_count} donation(s)</span>
              {profile.status === "cooling_down" && (
                <span className="card-meta" style={{ color:"#e67e22" }}>Cooldown until: {profile.next_eligible_date}</span>
              )}
            </div>
          </div>

          <button
            onClick={toggleAvailable}
            style={{ display:"flex", alignItems:"center", gap:8, background:"transparent", border:`1px solid ${profile.is_available?"rgba(39,174,96,.5)":"#2a2a2a"}`, borderRadius:3, padding:"8px 16px", cursor:"pointer", color: profile.is_available?"#58d68d":"#888", fontFamily:"'Oswald',sans-serif", letterSpacing:".06em", fontSize:".82rem", textTransform:"uppercase", transition:"all .2s" }}
          >
            {profile.is_available ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
            {profile.is_available ? "Available" : "Unavailable"}
          </button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Broadcasts */}
      <h2>{t("myBroadcasts")}</h2>
      {broadcasts.length === 0 && <p className="list-empty">{t("noBroadcasts")}</p>}
      {broadcasts.map((b) => (
        <div className="card" key={b.id} style={{ borderLeft:`3px solid var(--${URGENCY_BADGE[b.urgency_level]?.replace("badge-","")==="critical"?"red":"border"})` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
            <div>
              <p className="card-title">
                <strong style={{ color:"#C0392B" }}>{b.blood_group}</strong> needed{" "}
                <span className={`badge ${URGENCY_BADGE[b.urgency_level]||""}`}>{t(b.urgency_level)}</span>
              </p>
              <p className="card-meta">{b.units_required} unit(s) required · {b.units_remaining} remaining</p>
              <p className="card-meta">{b.hospital_name}{b.ward_location && ` · ${b.ward_location}`}</p>
              {b.distance_km != null && <p className="card-meta">📍 ~{b.distance_km.toFixed(1)} km away</p>}
            </div>
            <button className="btn btn-sm btn-red" disabled={acceptBusyId === b.id} onClick={()=>accept(b.id)}>
              {acceptBusyId===b.id ? t("loadingText") : t("accept")}
            </button>
          </div>
        </div>
      ))}

      {matches.length > 0 && (
        <>
          <h2>Active &amp; Past Matches</h2>
          {matches.map((m) => <MatchCard key={m.id} match={m} role="donor" onChanged={loadAll} />)}
        </>
      )}
    </div>
  );
}
