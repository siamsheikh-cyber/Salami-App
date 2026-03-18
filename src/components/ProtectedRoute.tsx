import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("salami_admin_token");
  if (!token) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};
