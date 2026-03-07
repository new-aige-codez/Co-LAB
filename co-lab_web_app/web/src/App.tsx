import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, fetchWithAuth } from './store/authStore';

// Error boundary to catch and display component crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-red-900/50 border border-red-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-200 mb-3">Something went wrong</h2>
            <p className="text-red-300 text-sm font-mono break-all">
              {this.state.error?.message}
            </p>
            <pre className="text-red-400 text-xs mt-3 overflow-auto max-h-48">
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}



// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SetupApiKeyPage from './pages/SetupApiKeyPage';
import SetupWizardPage from './pages/SetupWizardPage';
import DashboardPage from './pages/DashboardPage';
import WorkspaceListPage from './pages/WorkspaceListPage';
import WorkspacePage from './pages/WorkspacePage';
import ResearchPage from './pages/ResearchPage';
import ReportsPage from './pages/ReportsPage';
import TaskBoardPage from './pages/TaskBoardPage';
import UpcomingFeaturesPage from './pages/UpcomingFeaturesPage';
import ProposedFeaturesPage from './pages/ProposedFeaturesPage';
import RecycleBinPage from './pages/RecycleBinPage';
import AgentSquadPage from './pages/AgentSquadPage';
import MemoryBrowserPage from './pages/MemoryBrowserPage';
import SettingsPage from './pages/SettingsPage';
import UserProfilePage from './pages/UserProfilePage';

// Components
import { AgentChatWidget } from './components/agent-chat';
import { AppShell } from './components/AppShell';

// AUTH BYPASS: ProtectedRoute and ApiKeyCheck are pass-throughs while auth is disabled.
// To re-enable: uncomment the original logic blocks below and remove the bypass returns.

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // --- ORIGINAL AUTH LOGIC (disabled) ---
  // const { isAuthenticated, isLoading } = useAuthStore();
  // const location = useLocation();
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-900">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
  //     </div>
  //   );
  // }
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" state={{ from: location }} replace />;
  // }
  // --- END ORIGINAL AUTH LOGIC ---

  return <>{children}</>;
}

// Check if user needs to set up API key
function ApiKeyCheck({ children }: { children: React.ReactNode }) {
  // --- ORIGINAL API KEY CHECK (disabled) ---
  // const { hasApiKey } = useAuthStore();
  // const location = useLocation();
  // if (location.pathname === '/setup-api-key') {
  //   return <>{children}</>;
  // }
  // if (!hasApiKey) {
  //   return <Navigate to="/setup-api-key" replace />;
  // }
  // --- END ORIGINAL API KEY CHECK ---

  return <>{children}</>;
}

function App() {
  const { isAuthenticated, setUser, setToken, setHasApiKey, setLoading } = useAuthStore();

  // Check for existing session on mount
  useEffect(() => {
    async function checkSession() {
      setLoading(true);
      const result = await fetchWithAuth<{ user: any; hasApiKey: boolean }>('/auth/me');

      if (result.data) {
        setUser(result.data.user);
        setHasApiKey(result.data.hasApiKey);
      } else {
        // Token invalid, clear auth
        setUser(null);
        setToken(null);
      }

      setLoading(false);
    }

    if (isAuthenticated) {
      checkSession();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <ErrorBoundary>
        <AgentChatWidget />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/setup-api-key"
            element={
              <ProtectedRoute>
                <SetupApiKeyPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ApiKeyCheck>
                  <DashboardPage />
                </ApiKeyCheck>
              </ProtectedRoute>
            }
          />

          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <ApiKeyCheck>
                  <AppShell><WorkspaceListPage /></AppShell>
                </ApiKeyCheck>
              </ProtectedRoute>
            }
          />

          <Route
            path="/workspace/:id"
            element={
              <ProtectedRoute>
                <ApiKeyCheck>
                  <AppShell><WorkspacePage /></AppShell>
                </ApiKeyCheck>
              </ProtectedRoute>
            }
          />

          <Route
            path="/research"
            element={
              <ProtectedRoute>
                <ApiKeyCheck>
                  <AppShell><ResearchPage /></AppShell>
                </ApiKeyCheck>
              </ProtectedRoute>
            }
          />

          <Route
            path="/research/reports"
            element={
              <ProtectedRoute>
                <ApiKeyCheck>
                  <ReportsPage />
                </ApiKeyCheck>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks"
            element={<Navigate to="/tasks/kanplan" replace />}
          />

          <Route
            path="/tasks/kanplan"
            element={
              <ProtectedRoute>
                <ApiKeyCheck>
                  <AppShell><TaskBoardPage /></AppShell>
                </ApiKeyCheck>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks/upcoming"
            element={
              <ProtectedRoute>
                <ApiKeyCheck>
                  <AppShell><UpcomingFeaturesPage /></AppShell>
                </ApiKeyCheck>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks/proposed"
            element={
              <ProtectedRoute>
                <ApiKeyCheck>
                  <AppShell><ProposedFeaturesPage /></AppShell>
                </ApiKeyCheck>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks/recycled"
            element={
              <ProtectedRoute>
                <ApiKeyCheck>
                  <AppShell><RecycleBinPage /></AppShell>
                </ApiKeyCheck>
              </ProtectedRoute>
            }
          />

          <Route
            path="/agents"
            element={
              <ProtectedRoute>
                <ApiKeyCheck>
                  <AppShell><AgentSquadPage /></AppShell>
                </ApiKeyCheck>
              </ProtectedRoute>
            }
          />

          <Route
            path="/memory"
            element={
              <ProtectedRoute>
                <ApiKeyCheck>
                  <AppShell><MemoryBrowserPage /></AppShell>
                </ApiKeyCheck>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <ApiKeyCheck>
                  <AppShell><SettingsPage /></AppShell>
                </ApiKeyCheck>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ApiKeyCheck>
                  <AppShell><UserProfilePage /></AppShell>
                </ApiKeyCheck>
              </ProtectedRoute>
            }
          />

          {/* Setup Wizard - first run experience */}
          <Route
            path="/setup"
            element={
              <ProtectedRoute>
                <SetupWizardPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect - AUTH BYPASS: always go to dashboard */}
          {/* Original: <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} /> */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
