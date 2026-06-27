import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, currentRole } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
