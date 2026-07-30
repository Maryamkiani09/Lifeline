import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { MapPin, ShieldCheck } from "lucide-react";

const BLOOD_GROUPS = ["O-","O+","A-","A+","B-","B+","AB-","AB+"];
const CHECKLIST_FIELDS = [
  ["has_recent_tattoo_or_piercing","Recent tattoo or piercing (within 12 months)"],
  ["has_recent_major_surgery","Recent major surgery (within 6 months)"],
  ["on_blood_thinners","Currently on blood thinners"],
  ["hiv_positive","HIV positive"],
  ["hepatitis_b_or_c","Hepatitis B or C"],
  ["has_chronic_illness","Chronic illness"],
  ["recent_malaria_endemic_travel","Recent travel to a malaria-endemic area"],
  ["is_pregnant_or_recent_childbirth","Pregnant or gave birth within 6 months"],
];

function formatError(err) {
  if (err.data && typeof err.data === "object")
    return Object.entries(err.data).map(([k,v])=>`${k}: ${Array.isArray(v)?v.join(", "):v}`).join(" | ");
  return err.message || "Something went wrong.";
}

export default function RegisterDonor() {
  const { t, lang } = useLanguage();
  const { applyTokensAndLoadUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username:"", email:"", password:"", cnic:"", phone_number:"",
    blood_group:"O+", city:"", latitude:"", longitude:"", travel_radius_km:15,
    age:"", weight_kg:"",
    has_recent_tattoo_or_piercing:false, has_recent_major_surgery:false,
    on_blood_thinners:false, hiv_positive:false, hepatitis_b_or_c:false,
    has_chronic_illness:false, recent_malaria_endemic_travel:false,
    is_pregnant_or_recent_childbirth:false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locStatus, setLocStatus] = useState(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const useMyLocation = () => {
    if (!navigator.geolocation) { setLocStatus("Geolocation not supported."); return; }
    setLocStatus("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => { set("latitude",pos.coords.latitude.toFixed(6)); set("longitude",pos.coords.longitude.toFixed(6)); setLocStatus("✓ Location set"); },
      () => setLocStatus("Couldn't get location — you can still register without it."),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const payload = { ...form, preferred_language:lang||"en", age:Number(form.age), weight_kg:Number(form.weight_kg),
        travel_radius_km:Number(form.travel_radius_km),
        latitude:form.latitude?Number(form.latitude):null, longitude:form.longitude?Number(form.longitude):null };
      const data = await api.post("/api/donors/register/", payload, { auth:false });
      await applyTokensAndLoadUser(data);
      navigate("/dashboard");
    } catch(err) { setError(formatError(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="page page-narrow">
      <h1 style={{ marginBottom:4 }}>{t("registerAsDonor")}</h1>
      <p className="subtitle">Save lives — register once, get matched automatically.</p>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}

          <div className="form-row">
            <div><label>{t("username")}</label><input required value={form.username} onChange={e=>set("username",e.target.value)} placeholder="your_handle" /></div>
            <div><label>{t("email")}</label><input type="email" required value={form.email} onChange={e=>set("email",e.target.value)} placeholder="you@email.com" /></div>
          </div>

          <div><label>{t("password")}</label><input type="password" required minLength={8} value={form.password} onChange={e=>set("password",e.target.value)} placeholder="Min 8 characters" /></div>

          <div className="form-row">
            <div><label>{t("cnic")}</label><input required placeholder="12345-1234567-1" value={form.cnic} onChange={e=>set("cnic",e.target.value)} /></div>
            <div><label>{t("phoneNumber")}</label><input required value={form.phone_number} onChange={e=>set("phone_number",e.target.value)} placeholder="03XX-XXXXXXX" /></div>
          </div>

          <div className="form-row">
            <div>
              <label>{t("bloodGroup")}</label>
              <select value={form.blood_group} onChange={e=>set("blood_group",e.target.value)}>
                {BLOOD_GROUPS.map(bg=><option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div><label>{t("city")}</label><input required value={form.city} onChange={e=>set("city",e.target.value)} placeholder="Karachi" /></div>
          </div>

          <div className="form-row">
            <div><label>{t("age")}</label><input type="number" required min={18} max={65} value={form.age} onChange={e=>set("age",e.target.value)} /></div>
            <div><label>{t("weightKg")}</label><input type="number" required min={50} value={form.weight_kg} onChange={e=>set("weight_kg",e.target.value)} /></div>
            <div><label>{t("travelRadius")}</label><input type="number" required min={1} value={form.travel_radius_km} onChange={e=>set("travel_radius_km",e.target.value)} /></div>
          </div>

          <div>
            <button type="button" className="btn btn-outline btn-sm" onClick={useMyLocation} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <MapPin size={14}/> Use my location
            </button>
            {locStatus && <p className="card-meta" style={{ marginTop:6 }}>{locStatus}</p>}
          </div>

          <div style={{ borderTop:"1px solid #222", paddingTop:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <ShieldCheck size={16} style={{ color:"#C0392B" }} />
              <h2 style={{ margin:0, fontSize:".88rem" }}>{t("eligibilityChecklist")}</h2>
            </div>
            <p style={{ color:"#555", fontSize:".82rem", margin:"0 0 12px" }}>Check any that apply to you. We'll factor these into your eligibility automatically.</p>
            {CHECKLIST_FIELDS.map(([key,label])=>(
              <div className="checkbox-row" key={key} style={{ marginBottom:8 }}>
                <input type="checkbox" id={key} checked={form[key]} onChange={e=>set(key,e.target.checked)} />
                <label htmlFor={key} style={{ marginBottom:0, fontWeight:400, textTransform:"none", letterSpacing:0 }}>{label}</label>
              </div>
            ))}
          </div>

          <button className="btn" type="submit" disabled={loading} style={{ width:"100%" }}>
            {loading ? t("loadingText") : "Complete Registration"}
          </button>
        </form>
      </div>

      <p style={{ textAlign:"center", color:"#555", fontSize:".85rem" }}>
        Already registered? <Link to="/login">Sign in →</Link>
      </p>
    </div>
  );
}
