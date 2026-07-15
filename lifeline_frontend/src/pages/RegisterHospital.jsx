import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function RegisterHospital() {
  const { t } = useLanguage();
  const { applyTokensAndLoadUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", official_address: "", city: "", license_number: "",
    official_contact: "", official_email: "",
    admin_username: "", admin_email: "", admin_password: "",
    admin_cnic: "", admin_phone_number: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.post("/api/hospitals/register/", form, { auth: false });
      await applyTokensAndLoadUser(data);
      setSuccess("Hospital registered! It's pending verification — an admin needs to approve it in Django admin before it appears in the public directory or can broadcast requests.");
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-narrow">
      <h1>{t("registerHospital")}</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}
          {success && <div className="success-box">{success}</div>}

          <h2 style={{ fontSize: "1rem", margin: "0 0 4px" }}>Hospital details</h2>
          <div>
            <label>Hospital name</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label>Official address</label>
            <input required value={form.official_address} onChange={(e) => set("official_address", e.target.value)} />
          </div>
          <div className="form-row">
            <div>
              <label>{t("city")}</label>
              <input required value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <label>License number</label>
              <input required value={form.license_number} onChange={(e) => set("license_number", e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div>
              <label>Official contact number</label>
              <input required value={form.official_contact} onChange={(e) => set("official_contact", e.target.value)} />
            </div>
            <div>
              <label>Official email</label>
              <input type="email" required value={form.official_email} onChange={(e) => set("official_email", e.target.value)} />
            </div>
          </div>

          <h2 style={{ fontSize: "1rem", margin: "12px 0 4px" }}>Your admin login</h2>
          <div className="form-row">
            <div>
              <label>{t("username")}</label>
              <input required value={form.admin_username} onChange={(e) => set("admin_username", e.target.value)} />
            </div>
            <div>
              <label>{t("email")}</label>
              <input type="email" required value={form.admin_email} onChange={(e) => set("admin_email", e.target.value)} />
            </div>
          </div>
          <div>
            <label>{t("password")}</label>
            <input type="password" required minLength={8} value={form.admin_password} onChange={(e) => set("admin_password", e.target.value)} />
          </div>
          <div className="form-row">
            <div>
              <label>{t("cnic")}</label>
              <input required placeholder="12345-1234567-1" value={form.admin_cnic} onChange={(e) => set("admin_cnic", e.target.value)} />
            </div>
            <div>
              <label>{t("phoneNumber")}</label>
              <input required value={form.admin_phone_number} onChange={(e) => set("admin_phone_number", e.target.value)} />
            </div>
          </div>

          <button className="btn btn-outline" type="submit" disabled={loading}>
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
