import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app";
import { ThemeProvider } from "./app/theme-provider";
import { AuthProvider } from "./contexts/auth-context";
import { OrganizationProvider } from "./contexts/organization-context";
import { PlatformAdminProvider } from "./contexts/platform-admin-context";
import { ToastProvider } from "./components/ui/toast";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <PlatformAdminProvider>
            <OrganizationProvider>
              <App />
            </OrganizationProvider>
          </PlatformAdminProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
