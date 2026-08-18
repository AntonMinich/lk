import { Navigate, Route, Routes } from "react-router-dom";
import { AdminGate } from "./components/AdminLayout";
import { CabinetGate } from "./components/CabinetLayout";
import { AuthProvider } from "./lib/auth";
import { AdminLeasingDetailPage } from "./pages/AdminLeasingDetailPage";
import { AdminLeasingListPage } from "./pages/AdminLeasingListPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminPartnerDirectoryPage } from "./pages/AdminPartnerDirectoryPage";
import { AdminPartnerDetailPage } from "./pages/AdminPartnerDetailPage";
import { AdminPartnerListPage } from "./pages/AdminPartnerListPage";
import { AdminProfilePage } from "./pages/AdminProfilePage";
import { CabinetApplicationDetailPage } from "./pages/CabinetApplicationDetailPage";
import { CabinetCalculatorPage } from "./pages/CabinetCalculatorPage";
import { CabinetPage } from "./pages/CabinetPage";
import { LoginPage } from "./pages/LoginPage";
import { NewApplicationPage } from "./pages/NewApplicationPage";
import { AdminNotificationsPage, CabinetNotificationsPage } from "./pages/NotificationsPage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route element={<CabinetGate />}>
          <Route path="/cabinet" element={<Navigate to="/cabinet/applications" replace />} />
          <Route path="/cabinet/applications" element={<CabinetPage />} />
          <Route path="/cabinet/applications/new" element={<NewApplicationPage />} />
          <Route path="/cabinet/applications/:id" element={<CabinetApplicationDetailPage />} />
          <Route path="/cabinet/calculator" element={<CabinetCalculatorPage />} />
          <Route path="/cabinet/notifications" element={<CabinetNotificationsPage />} />
        </Route>
        <Route element={<AdminGate />}>
          <Route path="/admin/partners" element={<AdminPartnerListPage />} />
          <Route path="/admin/partners/:id" element={<AdminPartnerDetailPage />} />
          <Route path="/admin/partners/:id/history" element={<AdminPartnerDetailPage />} />
          <Route path="/admin/partners/:id/archive" element={<AdminPartnerDetailPage />} />
          <Route path="/admin/partners/:id/comments" element={<AdminPartnerDetailPage />} />
          <Route path="/admin/directory" element={<AdminPartnerDirectoryPage />} />
          <Route path="/admin/directory/:id" element={<AdminPartnerDetailPage />} />
          <Route path="/admin/directory/:id/history" element={<AdminPartnerDetailPage />} />
          <Route path="/admin/directory/:id/archive" element={<AdminPartnerDetailPage />} />
          <Route path="/admin/directory/:id/comments" element={<AdminPartnerDetailPage />} />
          <Route path="/admin/leasing" element={<AdminLeasingListPage />} />
          <Route path="/admin/leasing/:id" element={<AdminLeasingDetailPage />} />
          <Route path="/admin/leasing/:id/history" element={<AdminLeasingDetailPage />} />
          <Route path="/admin/profile" element={<AdminProfilePage />} />
          <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
        </Route>
        <Route path="/admin/applications" element={<Navigate to="/admin/partners" replace />} />
        <Route path="/partners" element={<Navigate to="/admin/partners" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
