import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { AdminApplicationsPage } from "./pages/AdminApplicationsPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { CabinetPage } from "./pages/CabinetPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cabinet" element={<CabinetPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/applications" element={<AdminApplicationsPage />} />
        <Route path="/partners" element={<Navigate to="/admin/applications" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
