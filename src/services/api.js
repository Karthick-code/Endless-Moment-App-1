const configuredBase = import.meta.env?.VITE_API_BASE_URL;
export const API_BASE = (configuredBase || '/api').replace(/\/$/, '');
export const getAuthToken = () => {
    const sessionToken = sessionStorage.getItem('em_session_token');
    if (sessionToken) return sessionToken;
    try {
        const saved = JSON.parse(localStorage.getItem('em_offline_auth_v1') || 'null');
        const maxAge = 7 * 24 * 60 * 60 * 1000;
        return saved?.token && saved?.verifiedAt && Date.now() - saved.verifiedAt <= maxAge ? saved.token : null;
    } catch { return null; }
};
const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
});
async function readJson(res) {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
        const text = await res.text().catch(() => '');
        if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
            throw new Error('The server returned an HTML page instead of API JSON. Deploy the full-stack app on Render or set VITE_API_BASE_URL to your backend URL.');
        }
        throw new Error(`The server returned an unexpected response (HTTP ${res.status}).`);
    }
    const data = await res.json();
    if (!res.ok)
        throw new Error(data?.msg || data?.message || `Request failed (HTTP ${res.status}).`);
    return data;
}
const request = async (path, init) => {
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...getHeaders(), ...(init?.headers || {}) } });
    return readJson(res);
};
export const api = {
    getHealth: () => request('/health'),
    getAdmins: () => request('/admins'),
    createAdmin: (data) => request('/admins', { method: 'POST', body: JSON.stringify(data) }),
    deleteAdmin: (id) => request(`/admins/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    login: (email, pass) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: pass }) }),
    verify2FA: (data) => request('/auth/verify-2fa', { method: 'POST', body: JSON.stringify(data) }),
    setup2FA: (tempToken) => request('/auth/setup-2fa', { method: 'POST', body: JSON.stringify({ tempToken }) }),
    confirm2FASetup: (data) => request('/auth/confirm-2fa-setup', { method: 'POST', body: JSON.stringify(data) }),
    resetAdminAuthenticator: (id) => request(`/admins/${encodeURIComponent(id)}/reset-authenticator`, { method: 'POST', body: JSON.stringify({}) }),
    getLeads: () => request('/leads'),
    createLead: (lead) => request('/leads', { method: 'POST', body: JSON.stringify(lead) }),
    updateLead: (id, update) => request(`/leads/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(update) }),
    deleteLead: (id) => request(`/leads/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    getProjects: () => request('/projects'),
    uploadProjectImage: (dataUrl) => request('/projects/upload-image', { method: 'POST', body: JSON.stringify({ dataUrl }) }),
    createProject: (project) => request('/projects', { method: 'POST', body: JSON.stringify(project) }),
    updateProject: (id, update) => request(`/projects/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(update) }),
    deleteProject: (id) => request(`/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    getSecurityLogs: async () => {
        try {
            return await request('/security/logs');
        }
        catch {
            return [];
        }
    },
    getInvoices: () => request('/invoices'),
    createInvoice: (invoice) => request('/invoices', { method: 'POST', body: JSON.stringify(invoice) }),
};
