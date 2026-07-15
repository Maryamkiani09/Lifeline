import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="page">
      <h1>{t("appName")}</h1>
      <p className="subtitle">{t("tagline")}</p>

      <div className="card">
        <p className="card-title">{t("voiceModeIntro")}</p>
        <Link to="/voice-register"><button className="btn btn-red">{t("voiceModeButton")}</button></Link>
      </div>

      <h2>{t("registerAsPatient")}</h2>
      <div className="card">
        <p>Need blood urgently? Register a request in a couple of minutes.</p>
        <Link to="/register/patient"><button className="btn">{t("registerAsPatient")}</button></Link>
      </div>

      <h2>{t("registerAsDonor")}</h2>
      <div className="card">
        <p>Willing to donate? Register once, then get matched automatically.</p>
        <Link to="/register/donor"><button className="btn">{t("registerAsDonor")}</button></Link>
      </div>

      <h2>{t("registerHospital")}</h2>
      <div className="card">
        <p>Managing patients on behalf of your hospital? Register your organization.</p>
        <Link to="/register/hospital"><button className="btn btn-outline">{t("registerHospital")}</button></Link>
      </div>

      <h2>{t("hospitals")}</h2>
      <div className="card">
        <p>Browse registered hospitals and their active requests.</p>
        <Link to="/hospitals"><button className="btn btn-outline">{t("hospitals")}</button></Link>
      </div>
    </div>
  );
}
