import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LogoLoader from "@/components/app/LogoLoader";

export const ADMIN_EMAILS = [
  "528siqueira@gmail.com",
  // adicione mais emails de admin aqui
];

export function isAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAILS.includes(email);
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (!isAdminEmail(user.email)) {
      navigate("/app", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <LogoLoader fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdminEmail(user.email)) return null;

  return <>{children}</>;
}
