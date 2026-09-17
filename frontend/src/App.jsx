import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import AuthPage from './auth/AuthPage';
import Layout from './components/Layout';
import Matches from './pages/Matches';
import UploadResume from './pages/UploadResume';
import Shortlist from './pages/Shortlist';
import AgentPlaceholder from './pages/AgentPlaceholder';
import BriefingPlaceholder from './pages/BriefingPlaceholder';
import LoadingSpinner from './components/LoadingSpinner';

// The real access control lives server-side (every /matching, /shortlist,
// etc. route requires a valid Bearer token). This just stops a logged-out
// browser tab from rendering stale UI/cached state before redirecting.
function ProtectedRoute({ children }) {
  const { token, checkingSession } = useAuth();

  if (checkingSession) {
    return (
      <div className="app-shell-loading">
        <LoadingSpinner label="Loading…" />
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/matches" replace />} />
        <Route path="matches" element={<Matches />} />
        <Route path="upload" element={<UploadResume />} />
        <Route path="shortlist" element={<Shortlist />} />
        <Route path="agent" element={<AgentPlaceholder />} />
        <Route path="briefing" element={<BriefingPlaceholder />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
