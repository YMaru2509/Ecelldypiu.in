import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RequireAdminKey from './components/RequireAdminKey';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SocialSidebar from './components/SocialSidebar';
import Home from './pages/Home';
import About from './pages/About';
import Events from './pages/Events';
import Team from './pages/Team';
import Blogs from './pages/Blogs';
import Contact from './pages/Contact';
import Sponsors from './pages/Sponsors';
import Inceptio from './pages/Inceptio';
import Inceptio26 from './pages/Inceptio26';
import Elevate from './pages/Elevate';
import SIH from './pages/SIH';
import FinBiz from './pages/FinBiz';
import InnovateForImpact from './pages/InnovateForImpact';
import BlogDetail1 from './pages/BlogDetail1';
import BlogDetail2 from './pages/BlogDetail2';
import BlogDetail3 from './pages/BlogDetail3';
import Linktree from './pages/Linktree';
import Collaborations from './pages/Collaborations';
import CollabStatus from './pages/CollabStatus';
import ApplyNow from './pages/ApplyNow';
import Newsletter from './pages/Newsletter';
import AdminPortal from './pages/AdminPortal';
import BlogDetail from './pages/BlogDetail';
import GetCertificate from './pages/GetCertificate';
import Redirect from './pages/Redirect';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import SetNewPassword from './pages/SetNewPassword';
import PanelHome from './pages/Panel/PanelHome';
import UsersRoles from './pages/Panel/UsersRoles';
import Members from './pages/Panel/Members';
import AttendanceQueue from './pages/Panel/AttendanceQueue';
import Verticals from './pages/Panel/Verticals';
import AttendanceRequestForm from './pages/AttendanceRequestForm';
import MyAttendanceRequests from './pages/MyAttendanceRequests';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <SpeedInsights />
        <Analytics />
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
                      path="/panel/verticals"
                      element={
                        <RequireAdminKey>
                          <Verticals />
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
      </Router>
    </AuthProvider>
  );
}

export default App;