import { Navigate } from "react-router";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  content: ReactNode;
}

const ProtectedRoute = ({ content }: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return content;
};

export default ProtectedRoute;
