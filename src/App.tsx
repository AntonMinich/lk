import { Navigate, Route, Routes } from "react-router-dom";
import { AdminGate } from "./components/AdminLayout";
import { AuthProvider } from "./lib/auth";
import { AdminLeasingDetailPage } from "./pages/AdminLeasingDetailPage";
import { AdminLeasingListPage } from "./pages/AdminLeasingListPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminPartnerDetailPage } from "./pages/AdminPartnerDetailPage";
import { AdminPartnerListPage } from "./pages/AdminPartnerListPage";
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
        <Route element={<AdminGate />}>
          <Route path="/admin/partners" element={<AdminPartnerListPage />} />
          <Route path="/admin/partners/:id" element={<AdminPartnerDetailPage />} />
          <Route path="/admin/leasing" element={<AdminLeasingListPage />} />
          <Route path="/admin/leasing/:id" element={<AdminLeasingDetailPage />} />
        </Route>
        <Route path="/admin/applications" element={<Navigate to="/admin/partners" replace />} />
        <Route path="/partners" element={<Navigate to="/admin/partners" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
