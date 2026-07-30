import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Droplet, Activity } from "lucide-react";

export default function LanguageSelect() {
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (lang) navigate("/home", { replace: true });
  }, [lang, navigate]);

  const choose = (code) => {
    setLang(code);
    navigate("/home");
  };

  return (
    <div className="lang-select-screen">
      {/* Logo */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <div style={{ position:"relative", width:70, height:70, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Droplet size={70} style={{ color:"#C0392B", fill:"#C0392B" }} className="pulse-drop" />
          <Activity size={28} style={{ color:"white", position:"absolute" }} />
        </div>
        <h1 style={{ fontFamily:"'Oswald',sans-serif", fontSize:"3rem", margin:0, letterSpacing:".12em", textTransform:"uppercase", color:"white" }}>
          Life<span style={{ color:"#C0392B" }}>Line</span>
        </h1>
        <p style={{ color:"#888", margin:0, fontSize:".95rem" }}>Pakistan's Emergency Blood Network</p>
        <p className="font-urdu" style={{ color:"#C0392B", fontSize:"1.3rem", margin:0, opacity:.85 }} dir="rtl">
          پاکستان کا ہنگامی خون کا نیٹ ورک
        </p>
      </div>

      {/* Language options */}
      <div>
        <p style={{ color:"#666", fontSize:".85rem", textTransform:"uppercase", letterSpacing:".1em", marginBottom:16 }}>
          Choose your language / اپنی زبان منتخب کریں
        </p>
        <div className="lang-options">
          <button onClick={() => choose("en")}>English</button>
          <button onClick={() => choose("ur")} style={{ fontFamily:"'Noto Nastaliq Urdu',serif", fontSize:"1.3rem", letterSpacing:0 }}>اردو</button>
        </div>
      </div>

      {/* Voice mode */}
      <button className="voice-link" onClick={() => navigate("/voice-register")}>
        🎤 Can't read or see the screen? Tap here for Voice Mode
      </button>
    </div>
  );
}
