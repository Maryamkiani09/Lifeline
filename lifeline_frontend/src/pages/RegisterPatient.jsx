import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
const URGENCY_LEVELS = ["low", "medium", "high", "critical"];

export default function RegisterPatient() {
  const { t, lang } = useLanguage();
  const { applyTokensAndLoadUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "", email: "", password: "", cnic: "", phone_number: "",
    patient_name: "", blood_group: "O+", units_required: 1,
    hospital_name_freetext: "", ward_location: "", urgency_level: "medium",
    latitude: "", longitude: "",
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
        setLocStatus("Location set ✓ (helps find nearby donors faster)");
      },
      () => setLocStatus("Couldn't get your location — you can still register without it."),
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
        units_required: Number(form.units_required),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      };
      const data = await api.post("/api/patients/register/", payload, { auth: false });
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
      <h1>{t("registerAsPatient")}</h1>
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

          <div>
            <label>{t("patientName")}</label>
            <input required value={form.patient_name} onChange={(e) => set("patient_name", e.target.value)}
              placeholder="Who is this request for?" />
          </div>

          <div className="form-row">
            <div>
              <label>{t("bloodGroup")}</label>
              <select value={form.blood_group} onChange={(e) => set("blood_group", e.target.value)}>
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label>{t("unitsRequired")}</label>
              <input type="number" required min={1} value={form.units_required} onChange={(e) => set("units_required", e.target.value)} />
            </div>
            <div>
              <label>{t("urgencyLevel")}</label>
              <select value={form.urgency_level} onChange={(e) => set("urgency_level", e.target.value)}>
                {URGENCY_LEVELS.map((u) => <option key={u} value={u}>{t(u)}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>{t("hospitalName")}</label>
              <input required value={form.hospital_name_freetext} onChange={(e) => set("hospital_name_freetext", e.target.value)} />
            </div>
            <div>
              <label>Ward / location (optional)</label>
              <input value={form.ward_location} onChange={(e) => set("ward_location", e.target.value)} />
            </div>
          </div>

          <div>
            <button type="button" className="btn btn-outline btn-sm" onClick={useMyLocation}>📍 Use my current location</button>
            {locStatus && <p className="card-meta">{locStatus}</p>}
          </div>

          <button className="btn btn-red" type="submit" disabled={loading}>
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
