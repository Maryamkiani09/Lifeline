import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const URGENCY_BADGE = { low: "badge-low", medium: "badge-medium", high: "badge-high", critical: "badge-critical" };

export default function HospitalDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [patients, setPatients] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/api/hospitals/${id}/`, { auth: false }),
      api.get(`/api/patients/public/hospital/${id}/`, { auth: false }),
    ])
      .then(([h, p]) => { setHospital(h); setPatients(p); })
      .catch((err) => setError(err.message));
  }, [id]);

  return (
    <div className="page">
      {error && <div className="error-box">{error}</div>}
      {hospital && (
        <>
          <h1>{hospital.name}</h1>
          <p className="subtitle">{hospital.official_address}, {hospital.city}</p>
        </>
      )}

      <h2>Active requests</h2>
      {patients?.length === 0 && <p className="list-empty">No active requests at this hospital right now.</p>}
      {patients?.map((p) => (
        <div className="card" key={p.id}>
          <p className="card-title">
            {p.blood_group} needed{" "}
            <span className={`badge ${URGENCY_BADGE[p.urgency_level] || ""}`}>{t(p.urgency_level)}</span>
          </p>
          <p className="card-meta">{p.units_required} unit(s) required, {p.units_remaining} remaining</p>
        </div>
      ))}

      {!user && (
        <div className="info-box">
          Want to help? {t("registerAsDonor")} first — matching donors are automatically
          notified when a request like these is created, and you'll be able to respond from your dashboard.
        </div>
      )}
    </div>
  );
}
