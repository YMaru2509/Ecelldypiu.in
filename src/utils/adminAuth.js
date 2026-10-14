// Attendance Management (the /panel console) authenticates with the same
// admin-panel credentials as the rest of /admin (see AdminPortal.jsx), not a
// personal member login — a deliberate choice. These helpers read/clear the
// same sessionStorage key AdminPortal.jsx itself sets on login.
export function getAdminKey() {
    return typeof window !== 'undefined' ? sessionStorage.getItem('adminKey') : null;
}

export function adminLogout() {
    sessionStorage.removeItem('adminKey');
    sessionStorage.removeItem('adminEmail');
}

export function adminAuthHeaders() {
    return { Authorization: `Bearer ${getAdminKey()}` };
}
