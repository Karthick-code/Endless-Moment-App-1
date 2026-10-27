const STORAGE_KEYS = {
    LEADS: 'em_admin_leads_clean',
    PROJECTS: 'em_admin_projects_clean',
    USER: 'em_admin_user_clean',
    LOGS: 'em_admin_security_logs_clean',
    SESSIONS: 'em_admin_sessions_clean',
};
// CLEAN STATE: ZERO SEEDED DEMO DATA
const INITIAL_USER = {
    email: '',
    name: '',
    role: 'owner',
    isGoogleVerified: false,
    twoFactorEnabled: true,
    preferred2FAMethod: 'totp',
    totpSecret: '',
    biometricRegistered: false,
    emergencyBackupCodes: [],
    verifiedDeviceName: 'This Device',
};
const INITIAL_LEADS = []; // ZERO DEMO DATA
const INITIAL_PROJECTS = []; // ZERO DEMO DATA
const INITIAL_LOGS = []; // ZERO DEMO DATA
export const getStoredLeads = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.LEADS);
        return raw ? JSON.parse(raw) : INITIAL_LEADS;
    }
    catch {
        return INITIAL_LEADS;
    }
};
export const saveStoredLeads = (leads) => {
    try {
        localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
    }
    catch (e) {
        console.error('Failed to save leads to storage', e);
    }
};
export const getStoredProjects = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        return raw ? JSON.parse(raw) : INITIAL_PROJECTS;
    }
    catch {
        return INITIAL_PROJECTS;
    }
};
export const saveStoredProjects = (projects) => {
    try {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    }
    catch (e) {
        console.error('Failed to save projects to storage', e);
    }
};
export const getStoredUser = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.USER);
        return raw ? JSON.parse(raw) : INITIAL_USER;
    }
    catch {
        return INITIAL_USER;
    }
};
export const saveStoredUser = (user) => {
    try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
    catch (e) {
        console.error('Failed to save user to storage', e);
    }
};
export const getStoredLogs = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
        return raw ? JSON.parse(raw) : INITIAL_LOGS;
    }
    catch {
        return INITIAL_LOGS;
    }
};
export const addSecurityLog = (event, status, method, details) => {
    try {
        const logs = getStoredLogs();
        const newLog = {
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            event,
            status,
            ip: 'Not collected locally',
            device: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown device',
            location: 'Not collected locally',
            method,
        };
        const updated = [newLog, ...logs.slice(0, 49)];
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
    }
    catch (e) {
        console.error('Failed to record security audit log', e);
    }
};
export const getStoredSessions = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
};
export const saveStoredSessions = (sessions) => {
    try {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    }
    catch (e) {
        console.error('Failed to save sessions to storage', e);
    }
};
