import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PublicRoute from "@/components/PublicRoute";

const LoginPage = lazy(() => import("@/pages/LoginPage"))
const SignupPage = lazy(() => import("@/pages/SignupPage"))
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"))
const DashboardLayout = lazy(() => import("@/layouts/DashboardLayout"))
const ProtectedRoute = lazy(() => import("@/components/ProtectedRoute"))
const SummeryOfDebitAndCredit = lazy(() => import("@/pages/bsa/SummeryOfDebitAndCredit"))
const DashboardPage = lazy(() => import("@/pages/DashboardPage"))
const CashFlow = lazy(() => import("@/pages/bsa/cashFlow/CashFlow"))
const OverviewMonthlyWise = lazy(() => import("@/pages/bsa/OverviewMonthlyWise"))

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><span className="h-10 w-10 rounded-full border-4 border-[#000080]/20 border-t-[#000080] animate-spin" /></div>}>
                <Routes>
                  {/* Public routes */}
                  <Route element={<PublicRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  </Route>

                  <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/home/dashboard" element={<DashboardPage />} />
                      <Route path="/bsa/summary-of-debit-and-credit" element={<SummeryOfDebitAndCredit />} />
                      <Route path="/bsa/cash-flow" element={<CashFlow />} />
                      <Route path="/bsa/overview-monthly-wise" element={<OverviewMonthlyWise />} />
                    </Route>
                  </Route>

                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}

export default App;
