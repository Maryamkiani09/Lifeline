import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { Droplet, Activity } from "lucide-react";

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <Link to="/home" className="brand" style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ position:"relative", width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Droplet size={26} style={{ color:"#C0392B", fill:"#C0392B", position:"absolute", animation:"pulse-glow 2s infinite alternate" }} />
          <Activity size={13} style={{ color:"white", position:"relative", zIndex:1 }} />
        </span>
        Life<span>Line</span>
      </Link>

      <nav>
        <Link to="/hospitals">{t("hospitals")}</Link>
        {!user && <Link to="/home">{t("home")}</Link>}
        {!user && <Link to="/login">{t("login")}</Link>}
        {user && <Link to="/dashboard">{t("dashboard")}</Link>}
        {user && <button className="link" onClick={handleLogout}>{t("logout")}</button>}
        <div className="lang-switch">
          <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
          <button className={lang === "ur" ? "active" : ""} onClick={() => setLang("ur")}>اردو</button>
        </div>
      </nav>
    </header>
  );
}
