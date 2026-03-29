import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const role = decoded.role;

    if (!allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (error) {
    localStorage.removeItem("token");
    return <Navigate to="/" replace />;
  }
}

export default ProtectedRoute;