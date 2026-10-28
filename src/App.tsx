import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminRoute, ProtectedRoute } from './components/Guards';
import { FullScreenLoader, SiteLayout } from './components/Layouts';
import { AuthProvider } from './context/AuthContext';
import { isFirebaseConfigured } from './lib/firebase';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const CertificatePage = lazy(() => import('./pages/CertificatePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TestPage = lazy(() => import('./pages/TestPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function SetupNotice() {
  return (
    <div className="app-bg stage grid min-h-dvh place-items-center p-4">
      <div className="panel grid max-w-lg gap-3 p-6">
        <h1>Firebase is not configured</h1>
        <p className="muted">
          Copy <code>.env.example</code> to <code>.env</code>, fill in your Firebase values, then restart the dev server.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  if (!isFirebaseConfigured) return <SetupNotice />;
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<FullScreenLoader />}>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="verify" element={<VerifyPage />} />
              <Route path="certificate/:certId" element={<CertificatePage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route element={<AdminRoute />}>
                  <Route path="admin" element={<AdminPage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="test/:testId" element={<TestPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
