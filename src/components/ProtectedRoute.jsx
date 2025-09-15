import { Navigate, useLocation } from "react-router-dom";
import { getUser } from "../utils/storage";

export default function ProtectedRoute({ children, roles }) {
  const user = getUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ role-based protection
  if (roles && !roles.includes(user.role?.name)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
