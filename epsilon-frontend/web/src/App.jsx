import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

// Pages publiques
import HomePage from "./pages/public/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyCertPage from "./pages/public/VerifyCertPage";

// Guards
import PrivateRoute from "./components/shared/PrivateRoute";

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Zone publique */}
      <Route path="/" element={<HomePage />} />
      <Route path="/connexion" element={<LoginPage />} />
      <Route path="/inscription" element={<RegisterPage />} />
      <Route path="/verifier/:code" element={<VerifyCertPage />} />

      {/* Zone privée — protégée par rôle */}
      <Route path="/dashboard/*" element={
        <PrivateRoute>
          <div>Dashboard — À construire feature par feature</div>
        </PrivateRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
