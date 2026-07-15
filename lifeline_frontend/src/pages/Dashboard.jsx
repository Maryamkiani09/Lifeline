import { useAuth } from "../context/AuthContext";
import DonorDashboard from "./DonorDashboard";
import PatientDashboard from "./PatientDashboard";
import HospitalDashboard from "./HospitalDashboard";

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) return <div className="page">Loading…</div>;
  if (!user) return null; // ProtectedRoute already handles redirect

  if (user.role === "donor") return <DonorDashboard />;
  if (user.role === "patient") return <PatientDashboard />;
  if (user.role === "hospital_staff") return <HospitalDashboard />;

  return (
    <div className="page">
      <div className="info-box">Admin accounts should use the Django admin panel at /admin/.</div>
    </div>
  );
}
