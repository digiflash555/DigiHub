import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import Events from './pages/Events';
import Profile from './pages/Profile';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateEvent from './pages/admin/CreateEvent';
import ManageAssociationMembers from './pages/admin/ManageAssociationMembers';
import ManageWinners from './pages/admin/ManageWinners';
import AttendanceScanner from './pages/staff/AttendanceScanner';
import AttendanceRecords from './pages/admin/AttendanceRecords';
import FeedbackManagement from './pages/admin/FeedbackManagement';
import FeedbackTemplates from './pages/admin/FeedbackTemplates';
import RegistrationTemplates from './pages/admin/RegistrationTemplates';
import StaffRoute from './components/auth/StaffRoute';
import ReportRoute from './components/auth/ReportRoute';
import ManageCertificates from './pages/admin/ManageCertificates';
import Winners from './pages/Winners';
import NominationSubmission from './pages/NominationSubmission';
import NominationFormBuilder from './pages/admin/NominationFormBuilder';
import ManageNominations from './pages/admin/ManageNominations';
import ManageFaculty from './pages/admin/ManageFaculty';
import Support from './pages/Support';
import ManageSupport from './pages/admin/ManageSupport';
import AssociationMemberProfile from './pages/AssociationMemberProfile';
import ManageVolunteers from './pages/admin/ManageVolunteers';
import SystemSettings from './pages/admin/SystemSettings';
import ManageExpenses from './pages/admin/ManageExpenses';
import TotalParticipation from './pages/admin/TotalParticipation';
import WorkRequests from './pages/WorkRequests';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ConfirmProvider } from './contexts/ConfirmContext';

function App() {
  return (
    <ThemeProvider>
      <ConfirmProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors duration-300 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-900/20 via-transparent to-transparent opacity-0 dark:opacity-100 pointer-events-none transition-opacity duration-500"></div>
            <div className="relative z-10">
          <Navbar />
          <main className="container mx-auto px-4 pt-24 pb-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/winners" element={<Winners />} />
              
              {/* Private Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/association-profile" element={<AssociationMemberProfile />} />
                <Route path="/nominate" element={<NominationSubmission />} />
                <Route path="/support" element={<Support />} />
                <Route path="/work-requests" element={<WorkRequests />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/events/create" element={<CreateEvent />} />
                <Route path="/admin/events/edit/:id" element={<CreateEvent />} />
                <Route path="/admin/association-members" element={<ManageAssociationMembers />} />
                <Route path="/admin/faculty" element={<ManageFaculty />} />
                <Route path="/admin/winners" element={<ManageWinners />} />
                <Route path="/admin/feedback-templates" element={<FeedbackTemplates />} />
                <Route path="/admin/registration-templates" element={<RegistrationTemplates />} />
                <Route path="/admin/certificates" element={<ManageCertificates />} />
                <Route path="/admin/nominations" element={<ManageNominations />} />
                <Route path="/admin/nomination-forms" element={<NominationFormBuilder />} />
                <Route path="/admin/support" element={<ManageSupport />} />
                <Route path="/admin/volunteers" element={<ManageVolunteers />} />
                <Route path="/admin/settings" element={<SystemSettings />} />
                <Route path="/admin/expenses" element={<ManageExpenses />} />
                <Route path="/admin/total-participation" element={<TotalParticipation />} />
              </Route>

              {/* Report Routes */}
              <Route element={<ReportRoute />}>
                <Route path="/admin/feedback" element={<FeedbackManagement />} />
                <Route path="/admin/attendance" element={<AttendanceRecords />} />
              </Route>

              {/* Staff Routes (Admin + Volunteer + Coordinators) */}
              <Route element={<StaffRoute />}>
                <Route path="/volunteer/dashboard" element={<AttendanceScanner />} />
                <Route path="/scanner" element={<AttendanceScanner />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Toaster position="top-right" />
            </div>
          </div>
        </Router>
      </AuthProvider>
      </ConfirmProvider>
    </ThemeProvider>
  );
}

export default App;
