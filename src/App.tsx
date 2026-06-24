import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/PublicOnlyRoute";
import { AuthProvider } from "@/contexts/AuthProvider";
import { queryClient } from "@/lib/queryClient";
import { MultiDayView } from "@/pages/MultiDayView";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { SettingsPage } from "@/pages/SettingsPage";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public, redirect away if already signed in */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Authenticated app */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MultiDayView />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
