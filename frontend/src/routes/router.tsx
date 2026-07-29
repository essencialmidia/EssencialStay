import { Navigate, createBrowserRouter } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { BarChart3, CreditCard, Sparkles, Settings2 } from "lucide-react";
import { AdminShell } from "../components/admin/admin-shell";
import { AppShell } from "../components/layout/app-shell";
import { GlobalHomeButton } from "../components/navigation/global-home-button";
import { ForgotPasswordPage } from "../pages/auth/forgot-password";
import { LoginPage } from "../pages/auth/login";
import { RegisterPage } from "../pages/auth/register";
import { AdminCompaniesPage } from "../pages/admin/companies";
import { AdminCompanyDetailsPage } from "../pages/admin/company-details";
import { AdminDashboardPage } from "../pages/admin/dashboard";
import { AdminEkazaPage } from "../pages/admin/ekaza";
import { AdminAkubelaPage } from "../pages/admin/akubela";
import { AdminPropertyDetailsPage } from "../pages/admin/property-details";
import { AdminPropertyFormPage } from "../pages/admin/property-form";
import { AdminUnitFormPage } from "../pages/admin/unit-form";
import { ConfiguracoesPage } from "../pages/configuracoes";
import { DashboardPage } from "../pages/dashboard";
import { AmbientesPage } from "../pages/ambientes";
import { DispositivosPage } from "../pages/dispositivos";
import { DemoAdminPage } from "../pages/demo-admin";
import { DemoGuestPortalPage } from "../pages/demo-guest-portal";
import { DemoVilaNovaPortalPage } from "../pages/demo-vila-nova-portal";
import { ExperienciaHospedePage } from "../pages/experiencia-hospede";
import { GuestCrmPage } from "../pages/guest-crm";
import { IntegracoesPage } from "../pages/integracoes";
import { ForbiddenPage } from "../pages/forbidden";
import { ModulePage } from "../pages/module-page";
import { NotFoundPage } from "../pages/not-found";
import { NovaPropriedadePage } from "../pages/nova-propriedade";
import { OnboardingPage } from "../pages/onboarding";
import { OperacoesPage } from "../pages/operacoes";
import { PropriedadeDetalhesPage } from "../pages/propriedade-detalhes";
import { PropriedadesPage } from "../pages/propriedades";
import { ReservasPage } from "../pages/reservas";
import { AdminGate } from "./admin-gate";
import { AdminOrganizationPanel } from "./admin-organization-panel";
import { OrganizationGate } from "./client-gate";
import { ProtectedRoute } from "./protected-route";
import { PublicRoute } from "./public-route";

const routes = [
  { path: "/demo/29-07", element: <DemoAdminPage /> },
  { path: "/demo/29-07/portal", element: <DemoGuestPortalPage /> },
  { path: "/s/hotel-monaco-demo", element: <DemoGuestPortalPage /> },
  { path: "/s/vila-nova-demo", element: <DemoVilaNovaPortalPage /> },
  { path: "/s/vila-nova/:slug", element: <DemoVilaNovaPortalPage /> },
  { path: "/demo/29-07/hospedagens", element: <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1440px]"><ReservasPage /></div></main> },
  { path: "/demo/29-07/*", element: <NotFoundPage /> },
  { element: <PublicRoute />, children: [{ path: "/login", element: <LoginPage /> }, { path: "/register", element: <RegisterPage /> }, { path: "/forgot-password", element: <ForgotPasswordPage /> }] },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/onboarding", element: <OnboardingPage /> },
      { path: "/403", element: <ForbiddenPage /> },
      {
        element: <AdminGate />,
        children: [{ path: "/admin", element: <AdminShell />, children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: "empresas", element: <AdminCompaniesPage /> },
          { path: "empresas/nova", element: <Navigate to="/onboarding?modo=nova-empresa" replace /> },
          { path: "empresas/:id", element: <AdminCompanyDetailsPage /> },
          { path: "empresas/:organizacaoId/painel", element: <AdminOrganizationPanel /> },
          { path: "empresas/:id/propriedades/nova", element: <AdminPropertyFormPage /> },
          { path: "propriedades/:id", element: <AdminPropertyDetailsPage /> },
          { path: "propriedades/:id/unidades/nova", element: <AdminUnitFormPage /> },
          { path: "configuracoes", element: <ModulePage title="Configurações da plataforma" description="Parâmetros globais serão adicionados em um próximo sprint." icon={Settings2} /> },
          { path: "ekaza", element: <AdminEkazaPage /> },
          { path: "akubela", element: <AdminAkubelaPage /> },
          { path: "*", element: <NotFoundPage /> },
        ] }],
      },
      {
        path: "/",
        errorElement: <NotFoundPage />,
        children: [{ element: <OrganizationGate />, children: [{ element: <AppShell />, children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "propriedades", element: <PropriedadesPage /> },
          { path: "propriedades/nova", element: <NovaPropriedadePage /> },
          { path: "propriedades/:propriedadeId", element: <PropriedadeDetalhesPage /> },
          { path: "ambientes", element: <AmbientesPage /> },
          { path: "hospedagens", element: <Navigate to="/propriedades" replace /> },
          { path: "hospedagens/:propriedadeId", element: <PropriedadeDetalhesPage /> },
          { path: "reservas", element: <ReservasPage /> },
          { path: "hospedes", element: <GuestCrmPage /> },
          { path: "experiencia-hospede", element: <ExperienciaHospedePage /> },
          { path: "portal-hospede", element: <Navigate to="/experiencia-hospede" replace /> },
          { path: "dispositivos", element: <DispositivosPage /> },
          { path: "integracoes", element: <IntegracoesPage /> },
          { path: "automacao", element: <ModulePage title="Automação" description="Área futura para cenas e regras inteligentes." icon={Sparkles} /> },
          { path: "relatorios", element: <ModulePage title="Relatórios" description="Espaço futuro para indicadores operacionais, financeiros e de experiência." icon={BarChart3} /> },
          { path: "financeiro", element: <ModulePage title="Financeiro" description="Estrutura visual para receitas, pagamentos, planos e faturamento." icon={CreditCard} /> },
          { path: "limpeza", element: <OperacoesPage tipo="limpeza" /> },
          { path: "manutencao", element: <OperacoesPage tipo="manutencao" /> },
          { path: "configuracoes", element: <ConfiguracoesPage /> },
          { path: "*", element: <NotFoundPage /> },
        ] }] }],
      },
    ],
  },
] satisfies RouteObject[];

export const router = createBrowserRouter([
  {
    element: <GlobalHomeButton />,
    children: routes,
  },
]);
