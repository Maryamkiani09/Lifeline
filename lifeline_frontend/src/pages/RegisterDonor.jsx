import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

const CHECKLIST_FIELDS = [
  ["has_recent_tattoo_or_piercing", "Recent tattoo or piercing"],
  ["has_recent_major_surgery", "Recent major surgery"],
  ["on_blood_thinners", "Currently on blood thinners"],
  ["hiv_positive", "HIV positive"],
  ["hepatitis_b_or_c", "Hepatitis B or C"],
  ["has_chronic_illness", "Chronic illness"],
  ["recent_malaria_endemic_travel", "Recent travel to a malaria-endemic area"],
  ["is_pregnant_or_recent_childbirth", "Pregnant or recent childbirth"],
];

export default function RegisterDonor() {
  const { t, lang } = useLanguage();
  const { applyTokensAndLoadUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "", email: "", password: "", cnic: "", phone_number: "",
    blood_group: "O+", city: "", latitude: "", longitude: "", travel_radius_km: 15,
    age: "", weight_kg: "",
    has_recent_tattoo_or_piercing: false, has_recent_major_surgery: false,
    on_blood_thinners: false, hiv_positive: false, hepatitis_b_or_c: false,
    has_chronic_illness: false, recent_malaria_endemic_travel: false,
    is_pregnant_or_recent_childbirth: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locStatus, setLocStatus] = useState(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const useMyLocation = () => {
    if (!navigator.geolocation) { setLocStatus("Geolocation not supported by this browser."); return; }
    setLocStatus("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", pos.coords.latitude.toFixed(6));
        set("longitude", pos.coords.longitude.toFixed(6));
        setLocStatus("Location set ✓");
      },
      () => setLocStatus("Couldn't get your location — you can still register without it, but distance-based matching won't work as precisely."),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        preferred_language: lang || "en",
        age: Number(form.age),
        weight_kg: Number(form.weight_kg),
        travel_radius_km: Number(form.travel_radius_km),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      };
      const data = await api.post("/api/donors/register/", payload, { auth: false });
      await applyTokensAndLoadUser(data);
      navigate("/dashboard");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-narrow">
      <h1>{t("registerAsDonor")}</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}

          <div className="form-row">
            <div>
              <label>{t("username")}</label>
              <input required value={form.username} onChange={(e) => set("username", e.target.value)} />
            </div>
            <div>
              <label>{t("email")}</label>
              <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>

          <div>
            <label>{t("password")}</label>
            <input type="password" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} />
          </div>

          <div className="form-row">
            <div>
              <label>{t("cnic")}</label>
              <input required placeholder="12345-1234567-1" value={form.cnic} onChange={(e) => set("cnic", e.target.value)} />
            </div>
            <div>
              <label>{t("phoneNumber")}</label>
              <input required value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>{t("bloodGroup")}</label>
              <select value={form.blood_group} onChange={(e) => set("blood_group", e.target.value)}>
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label>{t("city")}</label>
              <input required value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>{t("age")}</label>
              <input type="number" required min={18} max={65} value={form.age} onChange={(e) => set("age", e.target.value)} />
            </div>
            <div>
              <label>{t("weightKg")}</label>
              <input type="number" required min={50} value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} />
            </div>
            <div>
              <label>{t("travelRadius")}</label>
              <input type="number" required min={1} value={form.travel_radius_km} onChange={(e) => set("travel_radius_km", e.target.value)} />
            </div>
          </div>

          <div>
            <button type="button" className="btn btn-outline btn-sm" onClick={useMyLocation}>📍 Use my current location</button>
            {locStatus && <p className="card-meta">{locStatus}</p>}
          </div>

          <h2 style={{ fontSize: "1.05rem" }}>{t("eligibilityChecklist")}</h2>
          {CHECKLIST_FIELDS.map(([key, label]) => (
            <div className="checkbox-row" key={key}>
              <input type="checkbox" id={key} checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
              <label htmlFor={key} style={{ marginBottom: 0, fontWeight: 400 }}>{label}</label>
            </div>
          ))}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? t("loadingText") : t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}

function formatError(err) {
  if (err.data && typeof err.data === "object") {
    return Object.entries(err.data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ");
  }
  return err.message || "Something went wrong.";
}
