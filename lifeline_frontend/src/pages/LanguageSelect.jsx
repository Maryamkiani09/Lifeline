import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

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
      <h1 style={{ fontSize: "2rem" }}>Life<span style={{ color: "#8b0000" }}>Line</span></h1>
      <p>Choose your language / اپنی زبان منتخب کریں</p>
      <div className="lang-options">
        <button onClick={() => choose("en")}>English</button>
        <button onClick={() => choose("ur")}>اردو</button>
      </div>
      <button className="voice-link" onClick={() => navigate("/voice-register")}>
        Can't read or see the screen? Tap here for Voice Mode →
      </button>
    </div>
  );
}
