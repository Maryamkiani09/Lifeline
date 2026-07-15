import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

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
      <Link to="/" className="brand">Life<span>Line</span></Link>
      <nav>
        <Link to="/hospitals">{t("hospitals")}</Link>
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
