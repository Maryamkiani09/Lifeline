import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import MatchCard from "../components/MatchCard";
import { Plus, X, Building2 } from "lucide-react";

const BLOOD_GROUPS = ["O-","O+","A-","A+","B-","B+","AB-","AB+"];
const URGENCY_LEVELS = ["low","medium","high","critical"];
const URGENCY_BADGE = { low:"badge-low", medium:"badge-medium", high:"badge-high", critical:"badge-critical" };

export default function HospitalDashboard() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patient_name:"", patient_contact:"", blood_group:"O+",
    units_required:1, ward_location:"", urgency_level:"medium",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [r, m] = await Promise.all([
        api.get("/api/patients/hospital-requests/"),
        api.get("/api/matches/my-matches/"),
      ]);
      setRequests(r); setMatches(m);
    } catch (err) {
      setError(err.data?.detail || "Couldn't load your hospital dashboard.");
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submitPatient = async (e) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    try {
      await api.post("/api/patients/hospital-requests/", { ...form, units_required:Number(form.units_required) });
      setForm({ patient_name:"", patient_contact:"", blood_group:"O+", units_required:1, ward_location:"", urgency_level:"medium" });
      setShowForm(false);
      await loadAll();
    } catch (err) {
      setError(err.data?.detail || "Couldn't add patient.");
    } finally { setSubmitting(false); }
  };

  const closeRequest = async (id) => {
    if (!confirm("Mark this request as removed?")) return;
    await api.del(`/api/patients/hospital-requests/${id}/`);
    loadAll();
  };

  return (
    <div className="page">
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
        <Building2 size={28} style={{ color:"#C0392B" }} />
        <h1 style={{ margin:0 }}>{t("dashboard")}</h1>
      </div>
      <p className="subtitle" style={{ color:"#C0392B", fontFamily:"'Oswald',sans-serif", letterSpacing:".08em" }}>
        HOSPITAL PORTAL
      </p>

      {error && <div className="error-box">{error}</div>}

      {/* Add patient button */}
      <div className="card">
        <button
          className={showForm ? "btn btn-outline btn-sm" : "btn btn-sm"}
          onClick={() => setShowForm(s => !s)}
          style={{ display:"flex", alignItems:"center", gap:6 }}
        >
          {showForm ? <><X size={14}/> Cancel</> : <><Plus size={14}/> {t("addPatient")}</>}
        </button>

        {showForm && (
          <form onSubmit={submitPatient} style={{ marginTop:20 }}>
            <div className="form-row">
              <div><label>{t("patientName")}</label><input required value={form.patient_name} onChange={e=>set("patient_name",e.target.value)} /></div>
              <div><label>{t("phoneNumber")}</label><input required value={form.patient_contact} onChange={e=>set("patient_contact",e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div>
                <label>{t("bloodGroup")}</label>
                <select value={form.blood_group} onChange={e=>set("blood_group",e.target.value)}>
                  {BLOOD_GROUPS.map(bg=><option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div><label>{t("unitsRequired")}</label><input type="number" min={1} required value={form.units_required} onChange={e=>set("units_required",e.target.value)} /></div>
              <div>
                <label>{t("urgencyLevel")}</label>
                <select value={form.urgency_level} onChange={e=>set("urgency_level",e.target.value)}>
                  {URGENCY_LEVELS.map(u=><option key={u} value={u}>{t(u)}</option>)}
                </select>
              </div>
            </div>
            <div><label>Ward / location</label><input value={form.ward_location} onChange={e=>set("ward_location",e.target.value)} placeholder="e.g. ICU Ward 2" /></div>
            <button className="btn btn-red" type="submit" disabled={submitting}>{submitting?t("loadingText"):t("submit")}</button>
          </form>
        )}
      </div>

      {/* Active requests */}
      <h2>{t("myHospitalRequests")}</h2>
      {requests.length === 0 && <p className="list-empty">No patient requests added yet. Use the button above to add one.</p>}
      {requests.map((r) => (
        <div className="card" key={r.id}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
            <div>
              <p className="card-title">
                {r.patient_name} — <strong style={{ color:"#C0392B" }}>{r.blood_group}</strong>{" "}
                <span className={`badge ${URGENCY_BADGE[r.urgency_level]||""}`}>{t(r.urgency_level)}</span>
              </p>
              <p className="card-meta">{r.units_required} unit(s) required · {r.units_remaining} remaining · status: <strong>{r.status}</strong></p>
              <p className="card-meta">📞 {r.patient_contact}{r.ward_location&&` · 📍 ${r.ward_location}`}</p>
            </div>
            {r.status !== "removed" && (
              <button className="btn btn-sm btn-danger-outline" onClick={()=>closeRequest(r.id)}>Remove</button>
            )}
          </div>
        </div>
      ))}

      {matches.length > 0 && (
        <>
          <h2>Matched Donors</h2>
          {matches.map((m) => <MatchCard key={m.id} match={m} role="hospital" onChanged={loadAll} />)}
        </>
      )}
    </div>
  );
}
