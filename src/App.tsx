import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  useLocation,
  Navigate
} from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Sidebar } from './components/layout/Sidebar';
import { PageTransition } from './components/layout/PageTransition';
import { HealthProvider } from './context/HealthContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { cn } from './lib/utils';

// Lazy load pages later or import directly for now
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import ClinicMap from './pages/ClinicMap';
import Finance from './pages/Finance';
import Procedure from './pages/Procedure';
import Profile from './pages/Profile';
import Role from './pages/Role';
import Friends from './pages/Friends';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AdvisorDashboard from './pages/advisor/AdvisorDashboard';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <PageTransition>
              {user?.role === 'doctor' ? <DoctorDashboard /> : 
               user?.role === 'advisor' ? <AdvisorDashboard /> : 
               <Dashboard />}
            </PageTransition>
          </ProtectedRoute>
        } />
        
        <Route path="/doctors" element={<ProtectedRoute allowedRoles={['user']}><PageTransition><Doctors /></PageTransition></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute allowedRoles={['user']}><PageTransition><ClinicMap /></PageTransition></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute allowedRoles={['user']}><PageTransition><Finance /></PageTransition></ProtectedRoute>} />
        <Route path="/procedure" element={<ProtectedRoute allowedRoles={['user']}><PageTransition><Procedure /></PageTransition></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute allowedRoles={['user']}><PageTransition><Friends /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="/role" element={<ProtectedRoute><PageTransition><Role /></PageTransition></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#f5f8fb_38%,#eef4f3_100%)]">
      {!isAuthPage && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_58%)]" />
          <div className="pointer-events-none absolute -left-16 top-24 h-40 w-40 rounded-full bg-sky-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 top-1/3 h-44 w-44 rounded-full bg-emerald-100/45 blur-3xl" />
        </>
      )}
      {!isAuthPage && <Sidebar />}
      <main className={cn("relative flex-1 overflow-y-auto max-h-screen", isAuthPage ? "w-full" : "pb-16 lg:pb-0")}>
        <AppRoutes />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <HealthProvider>
        <Router>
          <AppContent />
        </Router>
      </HealthProvider>
    </AuthProvider>
  );
}
