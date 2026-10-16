import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { Loader2 } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RequireAdminKey from './components/RequireAdminKey';
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
const SetNewPassword = lazy(() => import('./pages/SetNewPassword'));
const PanelHome = lazy(() => import('./pages/Panel/PanelHome'));
const UsersRoles = lazy(() => import('./pages/Panel/UsersRoles'));
const Members = lazy(() => import('./pages/Panel/Members'));
const EventsAttendance = lazy(() => import('./pages/Panel/EventsAttendance'));
const PublicCheckin = lazy(() => import('./pages/Panel/PublicCheckin'));
const AttendanceQueue = lazy(() => import('./pages/Panel/AttendanceQueue'));
const Verticals = lazy(() => import('./pages/Panel/Verticals'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const AttendanceRequestForm = lazy(() => import('./pages/AttendanceRequestForm'));
const MyAttendanceRequests = lazy(() => import('./pages/MyAttendanceRequests'));
import './App.css';

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
                    <Route
                      path="/panel"
                      element={
                        <RequireAdminKey>
                          <PanelHome />
                        </RequireAdminKey>
                      }
                    />
                    <Route
                      path="/panel/team"
                      element={
                        <RequireAdminKey>
                          <UsersRoles />
                        </RequireAdminKey>
                      }
                    />
                    <Route
                      path="/panel/members"
                      element={
                        <RequireAdminKey>
                          <Members />
                        </RequireAdminKey>
                      }
                    />
                    <Route
                      path="/panel/attendance"
                      element={
                        <RequireAdminKey>
                          <AttendanceQueue />
                        </RequireAdminKey>
                      }
                    />
                    <Route
                      path="/panel/events"
                      element={
                        <RequireAdminKey>
                          <EventsAttendance />
                        </RequireAdminKey>
                      }
                    />
                    <Route
                      path="/panel/verticals"
                      element={
                        <RequireAdminKey>
                          <Verticals />
                        </RequireAdminKey>
                      }
                    />
                    <Route
                      path="/panel/door-checkin"
                      element={
                        <RequireAdminKey>
                          <PublicCheckin />
                        </RequireAdminKey>
                      }
                    />
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