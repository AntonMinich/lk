import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { CabinetPage } from "./pages/CabinetPage";
import { LoginPage } from "./pages/LoginPage";
import { PartnersPage } from "./pages/PartnersPage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/cabinet" element={<CabinetPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
