import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Building2 } from "lucide-react";

function formatError(err) {
  if (err.data && typeof err.data === "object")
    return Object.entries(err.data).map(([k,v])=>`${k}: ${Array.isArray(v)?v.join(", "):v}`).join(" | ");
  return err.message || "Something went wrong.";
}

export default function RegisterHospital() {
  const { t } = useLanguage();
  const { applyTokensAndLoadUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:"", official_address:"", city:"", license_number:"",
    official_contact:"", official_email:"",
    admin_username:"", admin_email:"", admin_password:"",
    admin_cnic:"", admin_phone_number:"",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const data = await api.post("/api/hospitals/register/", form, { auth:false });
      await applyTokensAndLoadUser(data);
      setSuccess("Hospital registered! It's pending verification — an admin needs to approve it in Django admin before it appears in the public directory.");
      setTimeout(()=>navigate("/dashboard"),2500);
    } catch(err) { setError(formatError(err)); }
    finally { setLoading(false); }
  };

  const Field = ({ label, children }) => (
    <div><label>{label}</label>{children}</div>
  );

  return (
    <div className="page page-narrow">
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
        <Building2 size={28} style={{ color:"#C0392B" }} />
        <h1 style={{ margin:0 }}>{t("registerHospital")}</h1>
      </div>
      <p className="subtitle">Register your hospital to broadcast blood requests and manage matched donors.</p>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}
          {success && <div className="success-box">{success}</div>}

          <h2 style={{ marginTop:0 }}>Hospital Details</h2>

          <Field label="Hospital name">
            <input required value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Aga Khan University Hospital" />
          </Field>

          <Field label="Official address">
            <input required value={form.official_address} onChange={e=>set("official_address",e.target.value)} />
          </Field>

          <div className="form-row">
            <Field label={t("city")}><input required value={form.city} onChange={e=>set("city",e.target.value)} /></Field>
            <Field label="License number"><input required value={form.license_number} onChange={e=>set("license_number",e.target.value)} /></Field>
          </div>

          <div className="form-row">
            <Field label="Official contact number"><input required value={form.official_contact} onChange={e=>set("official_contact",e.target.value)} /></Field>
            <Field label="Official email"><input type="email" required value={form.official_email} onChange={e=>set("official_email",e.target.value)} /></Field>
          </div>

          <h2>Your Admin Login</h2>
          <p style={{ color:"#555", fontSize:".85rem", margin:"-8px 0 12px" }}>This will be your personal login to manage the hospital dashboard.</p>

          <div className="form-row">
            <Field label={t("username")}><input required value={form.admin_username} onChange={e=>set("admin_username",e.target.value)} /></Field>
            <Field label={t("email")}><input type="email" required value={form.admin_email} onChange={e=>set("admin_email",e.target.value)} /></Field>
          </div>

          <Field label={t("password")}>
            <input type="password" required minLength={8} value={form.admin_password} onChange={e=>set("admin_password",e.target.value)} placeholder="Min 8 characters" />
          </Field>

          <div className="form-row">
            <Field label={t("cnic")}><input required placeholder="12345-1234567-1" value={form.admin_cnic} onChange={e=>set("admin_cnic",e.target.value)} /></Field>
            <Field label={t("phoneNumber")}><input required value={form.admin_phone_number} onChange={e=>set("admin_phone_number",e.target.value)} /></Field>
          </div>

          <div className="info-box" style={{ fontSize:".82rem" }}>
            After registration, your hospital must be approved by a LifeLine administrator before appearing in the public directory.
          </div>

          <button className="btn btn-outline" type="submit" disabled={loading} style={{ width:"100%" }}>
            {loading ? t("loadingText") : "Register Hospital"}
          </button>
        </form>
      </div>

      <p style={{ textAlign:"center", color:"#555", fontSize:".85rem" }}>
        Already registered? <Link to="/login">Sign in →</Link>
      </p>
    </div>
  );
}
