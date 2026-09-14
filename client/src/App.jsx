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
import GameRoute from './components/auth/GameRoute';
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
import Games from './pages/Games';
import Ludo from './pages/Ludo';
import LudoAI from './pages/ludo/LudoAI';
import LudoLocal from './pages/ludo/LudoLocal';
import LudoOnline from './pages/ludo/LudoOnline';
import TicTacToeAI from './pages/TicTacToeAI';
import TicTacToeOffline from './pages/TicTacToeOffline';
import TicTacToeOnline from './pages/TicTacToeOnline';
import TicTacToeHistory from './pages/TicTacToeHistory';
import TicTacToeLeaderboard from './pages/TicTacToeLeaderboard';
import EmailLayout from './pages/admin/email/EmailLayout';
import ComposeEmail from './pages/admin/email/ComposeEmail';
import EmailTemplates from './pages/admin/email/EmailTemplates';
import EmailDrafts from './pages/admin/email/EmailDrafts';
import ScheduledEmails from './pages/admin/email/ScheduledEmails';
import EmailHistory from './pages/admin/email/EmailHistory';
import SentEmails from './pages/admin/email/SentEmails';
import EmailConfig from './pages/admin/email/EmailConfig';
import EmailStats from './pages/admin/email/EmailStats';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ConfirmProvider } from './contexts/ConfirmContext';

function App() {
  return (
    <ThemeProvider>
      <ConfirmProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors duration-500 relative overflow-hidden selection:bg-primary-500/30">
            {/* Premium Dynamic Background */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5 dark:from-primary-900/10 dark:via-transparent dark:to-slate-900/20 pointer-events-none transition-colors duration-700"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary-400/10 dark:bg-primary-600/10 blur-[120px] animate-pulse-slow pointer-events-none transition-colors duration-700"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-400/10 dark:bg-blue-800/10 blur-[150px] pointer-events-none transition-colors duration-700"></div>
            
            <div className="relative z-10">
          <Navbar />
          <main className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
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
                
                {/* Game Routes protected by GameRoute guard */}
                <Route element={<GameRoute />}>
                  <Route path="/games" element={<Games />} />
                  <Route path="/games/ludo" element={<Ludo />} />
                  <Route path="/games/ludo/ai" element={<LudoAI />} />
                  <Route path="/games/ludo/local" element={<LudoLocal />} />
                  <Route path="/games/ludo/online" element={<LudoOnline />} />
                  <Route path="/games/tictactoe/ai" element={<TicTacToeAI />} />
                  <Route path="/games/tictactoe/offline" element={<TicTacToeOffline />} />
                  <Route path="/games/tictactoe/online" element={<TicTacToeOnline />} />
                  <Route path="/games/tictactoe/history" element={<TicTacToeHistory />} />
                  <Route path="/games/tictactoe/leaderboard" element={<TicTacToeLeaderboard />} />
                </Route>
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
                {/* Email Management - nested routes */}
                <Route path="/admin/email" element={<EmailLayout />}>
                  <Route path="compose" element={<ComposeEmail />} />
                  <Route path="drafts" element={<EmailDrafts />} />
                  <Route path="scheduled" element={<ScheduledEmails />} />
                  <Route path="sent" element={<SentEmails />} />
                  <Route path="history" element={<EmailHistory />} />
                  <Route path="templates" element={<EmailTemplates />} />
                  <Route path="config" element={<EmailConfig />} />
                  <Route path="stats" element={<EmailStats />} />
                </Route>
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
