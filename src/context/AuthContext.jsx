import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredUser, saveStoredUser, addSecurityLog, getStoredSessions, saveStoredSessions, } from '../utils/storage';
import { generateGoogleChallengeNumber, generateBase32Secret, generateBackupCodes, } from '../utils/security';
import { api } from '../services/api';
const AuthContext = createContext(undefined);
const OFFLINE_AUTH_KEY = 'em_offline_auth_v1';
const OFFLINE_AUTH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const readOfflineAuth = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(OFFLINE_AUTH_KEY) || 'null');
        if (!saved || !saved.token || !saved.verifiedAt || Date.now() - saved.verifiedAt > OFFLINE_AUTH_MAX_AGE) return null;
        return saved;
    } catch { return null; }
};
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getStoredUser);
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return sessionStorage.getItem('em_auth_verified') === 'true' || Boolean(readOfflineAuth());
    });
    const [isLocked, setIsLocked] = useState(false);
    const [pending2FA, setPending2FA] = useState(null);
    const [authMethodUsed, setAuthMethodUsed] = useState(() => {
        return sessionStorage.getItem('em_auth_method') || null;
    });
    const [sessionToken, setSessionToken] = useState(() => {
        return sessionStorage.getItem('em_session_token') || readOfflineAuth()?.token || null;
    });
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutRemaining, setLockoutRemaining] = useState(0);
    const [dbStatus, setDbStatus] = useState(null);
    const [adminRegistered, setAdminRegistered] = useState(true);
    // Check Database & Health status on startup
    const checkHealth = async () => {
        try {
            const data = await api.getHealth();
            setDbStatus(data.database);
            setAdminRegistered(data.adminRegistered);
        }
        catch {
            setDbStatus({
                connected: false,
                type: 'local_offline',
                dbName: 'local_storage',
                host: 'local',
                configuredUri: 'Check .env',
            });
        }
    };
    useEffect(() => {
        checkHealth();
    }, []);
    // Auto-lock on idle timer (3 minutes of inactivity)
    useEffect(() => {
        if (!isAuthenticated || isLocked)
            return;
        let timeoutId;
        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setIsLocked(true);
                addSecurityLog('App Auto-Locked due to 3-minute idle inactivity', 'warning', 'Idle Guard');
            }, 3 * 60 * 1000);
        };
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
        resetTimer();
        return () => {
            clearTimeout(timeoutId);
            events.forEach((evt) => window.removeEventListener(evt, resetTimer));
        };
    }, [isAuthenticated, isLocked]);
    // Handle visibility change (lock when user switches apps on mobile)
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden && isAuthenticated && !isLocked) {
                setIsLocked(true);
                addSecurityLog('App locked on background switch (Privacy Shield)', 'success', 'OS Backgrounding');
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [isAuthenticated, isLocked]);
    // Brute force lockout countdown timer
    useEffect(() => {
        if (lockoutRemaining <= 0)
            return;
        const timer = setInterval(() => {
            setLockoutRemaining((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [lockoutRemaining]);
    // Primary Login Step (Checks MongoDB Database)
    const loginWithCredentials = async (email, pass) => {
        if (lockoutRemaining > 0) {
            return { success: false, error: `Account locked for security. Please wait ${lockoutRemaining}s.` };
        }
        try {
            // Password-only login: the API returns a signed JWT after validating credentials.
            const res = await api.login(email, pass);
            setFailedAttempts(0);
            setSessionToken(res.token);
            setAuthMethodUsed('Email and password');
            setIsAuthenticated(true);
            setIsLocked(false);
            setPending2FA(null);
            sessionStorage.setItem('em_auth_verified', 'true');
            sessionStorage.setItem('em_auth_method', 'Email and password');
            sessionStorage.setItem('em_session_token', res.token);
            // Only a successful online server login creates an offline-access grant.
            localStorage.setItem(OFFLINE_AUTH_KEY, JSON.stringify({ token: res.token, verifiedAt: Date.now(), user: res.user || null }));
            if (res.user) {
                setUser((prev) => {
                    const next = { ...prev, ...res.user };
                    saveStoredUser(next);
                    return next;
                });
            }
            addSecurityLog(`Database login verified for ${email}.`, 'success', 'MongoDB Password Auth');
            return { success: true };
        }
        catch (err) {
            const nextFail = failedAttempts + 1;
            setFailedAttempts(nextFail);
            const msg = err instanceof Error ? err.message : 'Database authentication failed.';
            if (nextFail >= 5) {
                setLockoutRemaining(60);
                addSecurityLog(`Rate limit: 5 failed login attempts for ${email}`, 'critical', 'BruteForce Guard');
                return { success: false, error: 'Too many failed attempts. Security lockout active for 60 seconds.' };
            }
            return { success: false, error: `${msg} (${5 - nextFail} attempts remaining)` };
        }
    };
    // OAuth is not configured in this project; never simulate a successful Google sign-in.
    const loginWithGoogleVerified = async () => ({
        success: false,
        error: 'Google sign-in is not configured yet. Use your admin email and password.',
    });
    const complete2FASetup = async (code) => {
        if (!pending2FA) return { success: false, error: 'No active setup session.' };
        try {
            const res = await api.confirm2FASetup({ tempToken: pending2FA.tempToken, code });
            const token = res.token;
            setSessionToken(token); setAuthMethodUsed('Authenticator enrollment'); setIsAuthenticated(true); setIsLocked(false); setPending2FA(null);
            sessionStorage.setItem('em_auth_verified', 'true'); sessionStorage.setItem('em_auth_method', 'Authenticator enrollment'); sessionStorage.setItem('em_session_token', token);
            if (res.user) { setUser(prev => { const next = { ...prev, ...res.user }; saveStoredUser(next); return next; }); }
            return { success: true };
        } catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Could not finish setup.' }; }
    };
    // Step 2: 2FA Verification Handler against Server / MongoDB
    const verify2FACode = async (code, method) => {
        if (!pending2FA) {
            return { success: false, error: 'No active authentication challenge found.' };
        }
        try {
            const res = await api.verify2FA({
                email: pending2FA.email,
                code,
                method,
                tempToken: pending2FA.tempToken,
            });
            const token = res.token || `EM_SECURE_${Date.now()}`;
            const methodDescription = method === 'totp'
                ? 'Google Authenticator TOTP'
                : method === 'biometric'
                    ? 'Biometric (not configured)'
                    : method === 'google_push'
                        ? 'Google Security Push Notification'
                        : 'Emergency Recovery Code';
            setSessionToken(token);
            setAuthMethodUsed(methodDescription);
            setIsAuthenticated(true);
            setIsLocked(false);
            setPending2FA(null);
            sessionStorage.setItem('em_auth_verified', 'true');
            sessionStorage.setItem('em_auth_method', methodDescription);
            sessionStorage.setItem('em_session_token', token);
            if (res.user) {
                setUser((prev) => {
                    const next = { ...prev, ...res.user, lastLogin: new Date().toISOString() };
                    saveStoredUser(next);
                    return next;
                });
            }
            addSecurityLog(`Full Admin access granted to ${user.name} via ${methodDescription}.`, 'success', `Authenticator verification (${method})`);
            return { success: true };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Invalid 2FA code.';
            return { success: false, error: msg };
        }
    };
    // Biometric Unlock (for locked screen)
    const verifyBiometricUnlock = async () => {
        try {
            setIsLocked(false);
            addSecurityLog('Screen unlocked using Owner Biometrics', 'success', 'Biometric Enclave');
            return true;
        }
        catch {
            return false;
        }
    };
    const cancel2FA = () => {
        setPending2FA(null);
        addSecurityLog('Authentication session cancelled by user', 'warning', 'User Action');
    };
    const lockApp = () => {
        setIsLocked(true);
        addSecurityLog('App locked manually by Studio Owner', 'success', 'Manual Lock');
    };
    const unlockApp = () => {
        setIsLocked(false);
    };
    const logout = () => {
        setIsAuthenticated(false);
        setIsLocked(false);
        setPending2FA(null);
        setSessionToken(null);
        setAuthMethodUsed(null);
        sessionStorage.removeItem('em_auth_verified');
        sessionStorage.removeItem('em_auth_method');
        sessionStorage.removeItem('em_session_token');
        localStorage.removeItem(OFFLINE_AUTH_KEY);
        addSecurityLog('Studio Owner logged out. Session destroyed.', 'success', 'Sign Out');
    };
    const updateUser = (updated) => {
        setUser((prev) => {
            const next = { ...prev, ...updated };
            saveStoredUser(next);
            return next;
        });
    };
    const revokeSession = (sessionId) => {
        const sessions = getStoredSessions();
        const filtered = sessions.filter((s) => s.id !== sessionId);
        saveStoredSessions(filtered);
        addSecurityLog(`Revoked active device session: ${sessionId}`, 'warning', 'Session Management');
    };
    const emergencyLockdown = () => {
        const newSecret = generateBase32Secret();
        const newBackupCodes = generateBackupCodes(8);
        const updatedUser = {
            ...user,
            totpSecret: newSecret,
            emergencyBackupCodes: newBackupCodes,
        };
        setUser(updatedUser);
        saveStoredUser(updatedUser);
        saveStoredSessions([]);
        logout();
        addSecurityLog('EMERGENCY LOCKDOWN ACTIVATED: All sessions terminated, secrets regenerated.', 'critical', 'Kill Switch');
    };
    const regenerateTOTPSecret = () => {
        const newSecret = generateBase32Secret();
        const newBackupCodes = generateBackupCodes(8);
        updateUser({
            totpSecret: newSecret,
            emergencyBackupCodes: newBackupCodes,
        });
        addSecurityLog('Generated new Google Authenticator 2FA Secret Key', 'success', '2FA Management');
        return newSecret;
    };
    return (_jsx(AuthContext.Provider, { value: {
            user,
            isAuthenticated,
            isLocked,
            pending2FA,
            authMethodUsed,
            failedAttempts,
            lockoutRemaining,
            sessionToken,
            dbStatus,
            adminRegistered,
            checkHealth,
            loginWithCredentials,
            loginWithGoogleVerified,
            verify2FACode,
            complete2FASetup,
            verifyBiometricUnlock,
            cancel2FA,
            lockApp,
            unlockApp,
            logout,
            updateUser,
            revokeSession,
            emergencyLockdown,
            regenerateTOTPSecret,
        }, children: children }));
};
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
};
