import { Navigate } from "react-router-dom";

export function AdminCompanyFormPage() {
  return <Navigate to="/onboarding?modo=nova-empresa" replace />;
}
