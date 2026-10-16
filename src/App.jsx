import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { Loader2 } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PanelGate from './components/PanelGate';
import RequirePanelModule from './components/RequirePanelModule';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SocialSidebar from './components/SocialSidebar';
import Home from './pages/Home';
// Every other route is its own chunk, fetched only when visited — keeps the
// bundle a first-time visitor downloads to just the homepage + chrome
// instead of the whole site (admin panel included).
const About = lazy(() => import('./pages/About'));
const Events = lazy(() => import('./pages/Events'));
const Team = lazy(() => import('./pages/Team'));
const Blogs = lazy(() => import('./pages/Blogs'));
const Contact = lazy(() => import('./pages/Contact'));
const Sponsors = lazy(() => import('./pages/Sponsors'));
const Inceptio = lazy(() => import('./pages/Inceptio'));
const Inceptio26 = lazy(() => import('./pages/Inceptio26'));
const Elevate = lazy(() => import('./pages/Elevate'));
const SIH = lazy(() => import('./pages/SIH'));
const FinBiz = lazy(() => import('./pages/FinBiz'));
const InnovateForImpact = lazy(() => import('./pages/InnovateForImpact'));
const BlogDetail1 = lazy(() => import('./pages/BlogDetail1'));
const BlogDetail2 = lazy(() => import('./pages/BlogDetail2'));
const BlogDetail3 = lazy(() => import('./pages/BlogDetail3'));
const Linktree = lazy(() => import('./pages/Linktree'));
const Collaborations = lazy(() => import('./pages/Collaborations'));
const CollabStatus = lazy(() => import('./pages/CollabStatus'));
const ApplyNow = lazy(() => import('./pages/ApplyNow'));
const Newsletter = lazy(() => import('./pages/Newsletter'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const GetCertificate = lazy(() => import('./pages/GetCertificate'));
const Redirect = lazy(() => import('./pages/Redirect'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const CheckIn = lazy(() => import('./pages/CheckIn'));
const ScanCheckIn = lazy(() => import('./pages/ScanCheckIn'));
const SetNewPassword = lazy(() => import('./pages/SetNewPassword'));
const PanelHome = lazy(() => import('./pages/Panel/PanelHome'));
const UsersRoles = lazy(() => import('./pages/Panel/UsersRoles'));
const Members = lazy(() => import('./pages/Panel/Members'));
const EventsAttendance = lazy(() => import('./pages/Panel/EventsAttendance'));
const PublicCheckin = lazy(() => import('./pages/Panel/PublicCheckin'));
const BlogsPanel = lazy(() => import('./pages/Panel/BlogsPanel'));
const SubscribersPanel = lazy(() => import('./pages/Panel/SubscribersPanel'));
const PassesPanel = lazy(() => import('./pages/Panel/PassesPanel'));
const AuditPanel = lazy(() => import('./pages/Panel/AuditPanel'));
const SettingsPanel = lazy(() => import('./pages/Panel/SettingsPanel'));
const CertificatesPanel = lazy(() => import('./pages/Panel/CertificatesPanel'));
const LinksPanel = lazy(() => import('./pages/Panel/LinksPanel'));
const ManageEventsPanel = lazy(() => import('./pages/Panel/ManageEventsPanel'));
const EmbeddedToolPanel = lazy(() => import('./pages/Panel/EmbeddedToolPanel'));
const AttendanceQueue = lazy(() => import('./pages/Panel/AttendanceQueue'));
const Verticals = lazy(() => import('./pages/Panel/Verticals'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const AttendanceRequestForm = lazy(() => import('./pages/AttendanceRequestForm'));
const MyAttendanceRequests = lazy(() => import('./pages/MyAttendanceRequests'));
import './App.css';

// Admin-portal tools hosted inside the staff panel (see EmbeddedToolPanel).
const COLLAB_TABS = [{ key: 'manage-collaborations', label: 'Collaborations' }];
const BLOG_TABS = [{ key: 'create-blog', label: 'Write Blog' }];
const MAIL_TABS = [
  { key: 'mailer-announcement', label: 'Announcement' },
  { key: 'mailer-event', label: 'Event Mail' },
  { key: 'mailer-generic', label: 'Compose' },
  { key: 'email-logs', label: 'Send Log' },
];

const RouteFallback = () => (
  <div className="flex items-center justify-center py-32">
    <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <SpeedInsights />
        <Analytics />
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Standalone Route for URL Shortener Redirect (No Navbar/Footer/Chrome) */}
          <Route path="/s/:slug" element={<Redirect />} />

          {/* Standard Website Routes with Navbar, Footer & Social Sidebar */}
          <Route
            path="/*"
            element={
              <div className="App font-sans selection:bg-brand-yellow selection:text-[var(--text-on-brand)]">
                <Navbar />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute>
                          <Onboarding />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/checkin"
                      element={
                        <ProtectedRoute>
                          <CheckIn />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/checkin/scan"
                      element={
                        <ProtectedRoute>
                          <ScanCheckIn />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/set-password"
                      element={
                        <ProtectedRoute>
                          <SetNewPassword />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/about" element={<About />} />
                    <Route path="/sponsors" element={<Sponsors />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/events/inceptio-26" element={<Inceptio26 />} />
                    <Route path="/events/inceptio26" element={<Inceptio26 />} />
                    <Route path="/events/inceptio-25" element={<Inceptio />} />
                    <Route path="/events/inceptio25" element={<Inceptio />} />
                    <Route path="/events/inceptio" element={<Inceptio />} />
                    <Route path="/events/elevate" element={<Elevate />} />
                    <Route path="/events/sih" element={<SIH />} />
                    <Route path="/events/finbiz" element={<FinBiz />} />
                    <Route path="/events/innovate-for-impact" element={<InnovateForImpact />} />
                    <Route path="/events/:eventSlug/certificate" element={<GetCertificate />} />
                    <Route path="/events/:slug" element={<EventDetailPage />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/blogs" element={<Blogs />} />
                    <Route path="/blogs/where-ideas-meet-impact" element={<BlogDetail1 />} />
                    <Route path="/blogs/ceo-pune-meetup" element={<BlogDetail2 />} />
                    <Route path="/blogs/entrepreneurship-awareness-drive" element={<BlogDetail3 />} />
                    <Route path="/blogs/:slug" element={<BlogDetail />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/ourlinks" element={<Linktree />} />
                    <Route path="/collaborations" element={<Collaborations />} />
                    <Route path="/collaborations/status/:id" element={<CollabStatus />} />
                    <Route path="/apply" element={<ApplyNow />} />
                    <Route path="/newsletter" element={<Newsletter />} />
                    <Route path="/admin" element={<AdminPortal />} />
                    {/* Staff panel: one gate validates either the admin password or the member's own login, then each module checks its own permission. */}
                    <Route path="/panel" element={<PanelGate />}>
                      <Route index element={<PanelHome />} />
                      <Route path="team" element={<RequirePanelModule module="team"><UsersRoles /></RequirePanelModule>} />
                      <Route path="members" element={<RequirePanelModule module="members"><Members /></RequirePanelModule>} />
                      <Route path="blogs" element={<RequirePanelModule module="blogs"><BlogsPanel /></RequirePanelModule>} />
                      <Route path="subscribers" element={<RequirePanelModule module="subscribers"><SubscribersPanel /></RequirePanelModule>} />
                      <Route path="write-blog" element={<RequirePanelModule module="blog-editor"><EmbeddedToolPanel title="Write Blog" module="blogs" label="blogs" tabs={BLOG_TABS} /></RequirePanelModule>} />
                      <Route path="manage-events" element={<RequirePanelModule module="event-manager"><ManageEventsPanel /></RequirePanelModule>} />
                      <Route path="passes" element={<RequirePanelModule module="passes"><PassesPanel /></RequirePanelModule>} />
                      <Route path="certificates" element={<RequirePanelModule module="certificates"><CertificatesPanel /></RequirePanelModule>} />
                      <Route path="collaborations" element={<RequirePanelModule module="collaborations"><EmbeddedToolPanel title="Collaborations" module="collaborations" label="collaborations" tabs={COLLAB_TABS} /></RequirePanelModule>} />
                      <Route path="mass-mail" element={<RequirePanelModule module="mass-mail"><EmbeddedToolPanel title="Mass Mail" module="mass-mail" label="mass mail" tabs={MAIL_TABS} /></RequirePanelModule>} />
                      <Route path="links" element={<RequirePanelModule module="links"><LinksPanel /></RequirePanelModule>} />
                      <Route path="audit" element={<RequirePanelModule module="audit"><AuditPanel /></RequirePanelModule>} />
                      <Route path="settings" element={<RequirePanelModule module="settings"><SettingsPanel /></RequirePanelModule>} />
                      <Route path="attendance" element={<RequirePanelModule module="attendance-queue"><AttendanceQueue /></RequirePanelModule>} />
                      <Route path="events" element={<RequirePanelModule module="events"><EventsAttendance /></RequirePanelModule>} />
                      <Route path="door-checkin" element={<RequirePanelModule module="door-checkin"><PublicCheckin /></RequirePanelModule>} />
                      <Route path="verticals" element={<RequirePanelModule module="verticals"><Verticals /></RequirePanelModule>} />
                    </Route>
                    <Route
                      path="/attendance/new"
                      element={
                        <ProtectedRoute>
                          <AttendanceRequestForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/attendance/mine"
                      element={
                        <ProtectedRoute>
                          <MyAttendanceRequests />
                        </ProtectedRoute>
                      }
                    />
                    {/* Backward compatibility: redirect old path */}
                    <Route path="/linktree" element={<Navigate to="/ourlinks" replace />} />
                    {/* Fallback for unknown routes */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <SocialSidebar />
                <Footer />
              </div>
            }
          />
        </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;