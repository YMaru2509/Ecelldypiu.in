// The /panel console is reached two ways: with the shared admin-panel password
// from /admin (full access), or by a staff member signed in with their own
// account (only the modules their roles/permissions allow). Every panel fetch
// goes through adminAuthHeaders(), which sends whichever credential is active;
// the server decides what that credential may do on each request.
//
// A member's Firebase ID token rotates roughly hourly, so it lives in a
// module-level slot that PanelGate keeps current rather than being re-fetched
// (asynchronously) at every call site.
let memberPanelToken = null;

export function setMemberPanelToken(token) {
    memberPanelToken = token || null;
}

export function getAdminKey() {
    return typeof window !== 'undefined' ? sessionStorage.getItem('adminKey') : null;
}

export function adminLogout() {
    sessionStorage.removeItem('adminKey');
    sessionStorage.removeItem('adminEmail');
}

export function adminAuthHeaders() {
    return { Authorization: `Bearer ${getAdminKey() || memberPanelToken}` };
}
