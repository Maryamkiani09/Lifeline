import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

export default function HospitalDirectory() {
  const { t } = useLanguage();
  const [hospitals, setHospitals] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/api/hospitals/", { auth: false }).then(setHospitals).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <h1>{t("hospitalDirectory")}</h1>
      {error && <div className="error-box">{error}</div>}
      {!hospitals && !error && <p>{t("loadingText")}</p>}
      {hospitals?.length === 0 && <p className="list-empty">No verified hospitals yet.</p>}
      {hospitals?.map((h) => (
        <Link to={`/hospitals/${h.id}`} key={h.id} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card">
            <p className="card-title">{h.name}</p>
            <p className="card-meta">{h.city} · {h.active_request_count} {t("activeRequests")}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
