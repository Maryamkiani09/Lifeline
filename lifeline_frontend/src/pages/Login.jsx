import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Droplet, Activity } from "lucide-react";

export default function Login() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.data?.detail || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0D0D0D", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:440 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
            <Droplet size={52} style={{ color:"#C0392B", fill:"#C0392B" }} className="pulse-drop" />
            <Activity size={20} style={{ color:"white", position:"absolute" }} />
          </div>
          <h1 style={{ fontFamily:"'Oswald',sans-serif", fontSize:"2.2rem", margin:0, color:"white", letterSpacing:".1em", textTransform:"uppercase" }}>
            Life<span style={{ color:"#C0392B" }}>Line</span>
          </h1>
          <p style={{ color:"#555", margin:"6px 0 0", fontSize:".88rem" }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div style={{ background:"#141414", border:"1px solid #2a2a2a", borderRadius:4, padding:32 }}>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-box" style={{ marginBottom:20 }}>{error}</div>}

            <div style={{ marginBottom:16 }}>
              <label>{t("username")}</label>
              <input
                type="text"
                required
                value={form.username}
                autoComplete="username"
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="your_username"
              />
            </div>

            <div style={{ marginBottom:24 }}>
              <label>{t("password")}</label>
              <input
                type="password"
                required
                value={form.password}
                autoComplete="current-password"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <button className="btn" type="submit" disabled={loading} style={{ width:"100%" }}>
              {loading ? "Signing in…" : t("login")}
            </button>
          </form>
        </div>

        {/* Register links */}
        <div style={{ textAlign:"center", marginTop:24 }}>
          <p style={{ color:"#555", fontSize:".88rem", marginBottom:12 }}>Don't have an account?</p>
          <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/register/donor">
              <button className="btn btn-outline btn-sm">Register as Donor</button>
            </Link>
            <Link to="/register/patient">
              <button className="btn btn-sm" style={{ background:"#8B0000" }}>Register as Patient</button>
            </Link>
          </div>
          <p style={{ marginTop:16 }}>
            <Link to="/voice-register" style={{ color:"#555", fontSize:".82rem" }}>
              🎤 Use Voice Mode instead →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
