import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import LanguageSelect from "./pages/LanguageSelect";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterDonor from "./pages/RegisterDonor";
import RegisterPatient from "./pages/RegisterPatient";
import RegisterHospital from "./pages/RegisterHospital";
import Dashboard from "./pages/Dashboard";
import HospitalDirectory from "./pages/HospitalDirectory";
import HospitalDetail from "./pages/HospitalDetail";
import ChatRoom from "./pages/ChatRoom";
import VoiceRegister from "./pages/VoiceRegister";

function Shell() {
  const { lang } = useLanguage();
  const location = useLocation();
  const hideNavbar = !lang && location.pathname === "/";

  return (
    <div className="app-shell">
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LanguageSelect />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/donor" element={<RegisterDonor />} />
        <Route path="/register/patient" element={<RegisterPatient />} />
        <Route path="/register/hospital" element={<RegisterHospital />} />
        <Route path="/voice-register" element={<VoiceRegister />} />
        <Route path="/hospitals" element={<HospitalDirectory />} />
        <Route path="/hospitals/:id" element={<HospitalDetail />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/chat/:matchId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
