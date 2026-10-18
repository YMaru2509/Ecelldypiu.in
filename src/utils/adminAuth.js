// The /panel console uses the signed-in member's Firebase ID token. Every panel
// fetch goes through adminAuthHeaders(), and the server applies the member's
// roles and module permissions on every request.
//
// A member's Firebase ID token rotates roughly hourly, so it lives in a
// module-level slot that PanelGate keeps current rather than being re-fetched
// (asynchronously) at every call site.
let memberPanelToken = null;

export function setMemberPanelToken(token) {
    memberPanelToken = token || null;
}

export function adminLogout() {
    sessionStorage.removeItem('adminKey');
    sessionStorage.removeItem('adminEmail');
}

export function adminAuthHeaders() {
    return { Authorization: `Bearer ${memberPanelToken}` };
}
