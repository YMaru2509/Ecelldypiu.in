import { Navigate } from 'react-router-dom';

// Attendance Management (the /panel console) is gated by the same admin-panel
// credentials as the rest of /admin, by deliberate choice — not personal member
// login. Mirrors the client-side sessionStorage check AdminPortal.jsx itself
// uses; the real security boundary is the server-side Bearer-token comparison
// against ADMIN_API_KEY on every API call (see api/_lib/rbac.js).
const RequireAdminKey = ({ children }) => {
    const adminKey = typeof window !== 'undefined' ? sessionStorage.getItem('adminKey') : null;
    if (!adminKey) {
        return <Navigate to="/admin" replace />;
    }
    return children;
};

export default RequireAdminKey;
