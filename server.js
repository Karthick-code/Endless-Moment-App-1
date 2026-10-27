import express from 'express';
import http from 'http';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import { connectDB, getDbStatus } from './src/server/db.js';
import { UserRepo } from './src/server/models/User.js';
import { LeadRepo } from './src/server/models/Lead.js';
import { ProjectRepo } from './src/server/models/Project.js';
import { SecurityLogRepo } from './src/server/models/SecurityLog.js';
import { InvoiceRepo } from './src/server/models/Invoice.js';
dotenv.config();

// Cloudinary credentials belong only on the backend (Render environment variables).
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET ) {
    throw new Error('JWT_SECRET must be set.');
}
// CORS for separately deployed Netlify frontend. Set FRONTEND_URL to the exact
// deployed origin (for example https://your-site.netlify.app). Multiple origins
// may be comma-separated. Requests without an Origin (health checks/server calls) are allowed.
const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
app.use((req, res, next) => {
    const origin = req.headers.origin?.replace(/\/$/, '');
    if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') {
        if (origin && process.env.NODE_ENV === 'production' && !allowedOrigins.includes(origin)) {
            res.status(403).end();
            return;
        }
        res.status(204).end();
        return;
    }
    next();
});
// Compressed project photos are sent to the backend and uploaded to Cloudinary.
app.use(express.json({ limit: '12mb' }));
// Initialize MongoDB Connection
connectDB().catch((err) => {
    console.error('Initial MongoDB boot warning:', err);
});
// Middleware: Authenticate Admin JWT Token
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ msg: 'Unauthorized: Missing or invalid authorization token.' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        res.status(403).json({ msg: 'Forbidden: Session token expired or invalid.' });
    }
};
/* ----------------------------------------------------
 * DATABASE & SYSTEM HEALTH ENDPOINTS
 * ---------------------------------------------------- */
app.get('/api/health', async (_req, res) => {
    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
        res.status(503).json({ status: 'unavailable', database: dbStatus, adminRegistered: false, timestamp: new Date().toISOString() });
        return;
    }
    try {
        const adminCount = await UserRepo.countDocuments();
        res.json({ status: 'ok', database: dbStatus, adminRegistered: adminCount > 0, timestamp: new Date().toISOString() });
    }
    catch (err) {
        res.status(503).json({ status: 'unavailable', database: dbStatus, adminRegistered: false, msg: 'Database is not ready.' });
    }
});
// Fail closed: this application never stores client records in local JSON files.
// All data APIs require the configured MongoDB database to be available.
app.use('/api', (req, res, next) => {
    if (req.path === '/health') {
        next();
        return;
    }
    if (!getDbStatus().connected) {
        res.status(503).json({ msg: 'Database is not connected. Configure MONGODB_URI in the hosting environment.' });
        return;
    }
    next();
});
const decodeBase32 = (input) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0, value = 0;
    const out = [];
    for (const char of input.toUpperCase().replace(/[^A-Z2-7]/g, '')) {
        value = (value << 5) | alphabet.indexOf(char);
        bits += 5;
        if (bits >= 8) {
            out.push((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }
    return Buffer.from(out);
};
const generateBase32Secret = (bytes = 20) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const data = randomBytes(bytes); let bits = 0, value = 0, out = '';
    for (const byte of data) { value = (value << 8) | byte; bits += 8; while (bits >= 5) { out += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; } }
    if (bits) out += alphabet[(value << (5 - bits)) & 31];
    return out;
};
const generateBackupCodes = (count = 8) => Array.from({ length: count }, () => randomBytes(4).toString('hex').toUpperCase().match(/.{1,4}/g).join('-'));
const getChallengeUser = async (token) => {
    if (!token) return null;
    try { const decoded = jwt.verify(token, JWT_SECRET); if (decoded.step !== '2fa_required' || !decoded.id) return null; return await UserRepo.findOne({ _id: decoded.id, email: decoded.email }); } catch { return null; }
};
const verifyTotp = (submitted, secret) => {
    if (!/^\d{6}$/.test(submitted) || !secret)
        return false;
    const key = decodeBase32(secret);
    if (!key.length)
        return false;
    const nowStep = Math.floor(Date.now() / 1000 / 30);
    for (const drift of [-1, 0, 1]) {
        const counter = Buffer.alloc(8);
        counter.writeBigUInt64BE(BigInt(nowStep + drift));
        const digest = createHmac('sha1', key).update(counter).digest();
        const offset = digest[digest.length - 1] & 0x0f;
        const binary = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
        const expected = String(binary % 1000000).padStart(6, '0');
        if (timingSafeEqual(Buffer.from(expected), Buffer.from(submitted)))
            return true;
    }
    return false;
};
/* ----------------------------------------------------
 * AUTHENTICATION: DATABASE PASSWORD LOGIN
 * ---------------------------------------------------- */
// Public registration is disabled. Provision the first administrator from a trusted terminal.

// 2. Primary Login (Step 1: Check Database Credentials)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ msg: 'Please provide both email and password.' });
            return;
        }
        const cleanEmail = email.trim().toLowerCase();
        const user = await UserRepo.findOne({ email: cleanEmail });
        if (!user) {
            await SecurityLogRepo.create({
                event: `Failed login attempt: User not found (${cleanEmail})`,
                status: 'warning',
                ip: req.ip || '127.0.0.1',
                device: req.headers['user-agent'] || 'Mobile',
                location: 'Unknown',
                method: 'Database Credential Check',
            });
            res.status(401).json({ msg: 'Invalid credentials. User does not exist in database.' });
            return;
        }
        // Verify Password against bcrypt hash in database
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            await SecurityLogRepo.create({
                event: `Invalid password attempt for ${cleanEmail}`,
                status: 'warning',
                ip: req.ip || '127.0.0.1',
                device: req.headers['user-agent'] || 'Mobile',
                location: 'Unknown',
                method: 'bcrypt.compare()',
            });
            res.status(401).json({ msg: 'Invalid credentials. Incorrect password.' });
            return;
        }
        // Password-only admin login: issue a signed session token directly.
        const sessionToken = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        await UserRepo.updateOne({ email: cleanEmail }, { lastLogin: new Date() });
        await SecurityLogRepo.create({
            event: `Admin login successful for ${cleanEmail}`,
            status: 'success',
            ip: req.ip || '127.0.0.1',
            device: req.headers['user-agent'] || 'Mobile',
            location: 'Authorized Device',
            method: 'Password Login',
        });
        res.json({
            success: true,
            token: sessionToken,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                biometricRegistered: user.biometricRegistered,
                verifiedDeviceName: user.verifiedDeviceName,
            },
        });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ msg: 'Server error during database login.', error: msg });
    }
});
// First-time enrollment: secret is staged server-side and only activated after a valid TOTP.
app.post('/api/auth/setup-2fa', async (req, res) => {
    try {
        const user = await getChallengeUser(req.body?.tempToken);
        if (!user) return res.status(401).json({ msg: 'Setup session expired. Sign in again.' });
        if (user.totpEnabled === true) return res.status(409).json({ msg: 'Authenticator is already enabled. Use the recovery process to reset it.' });
        const secret = generateBase32Secret();
        const backupCodes = generateBackupCodes();
        await UserRepo.updateOne({ _id: user._id }, { pendingTotpSecret: secret, pendingBackupCodes: backupCodes });
        const issuer = 'Endless Moment';
        const label = encodeURIComponent(`${issuer}:${user.email}`);
        const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
        res.json({ secret, otpauthUrl, backupCodes });
    } catch { res.status(500).json({ msg: 'Could not start authenticator setup.' }); }
});
app.post('/api/auth/confirm-2fa-setup', async (req, res) => {
    try {
        const user = await getChallengeUser(req.body?.tempToken);
        if (!user) return res.status(401).json({ msg: 'Setup session expired. Sign in again.' });
        if (user.totpEnabled === true) return res.status(409).json({ msg: 'Authenticator is already enabled.' });
        if (!user.pendingTotpSecret || !verifyTotp(String(req.body?.code || '').trim(), user.pendingTotpSecret)) return res.status(400).json({ msg: 'Invalid code. Add the displayed secret to your authenticator and try the current six-digit code.' });
        const codes = user.pendingBackupCodes || [];
        await UserRepo.updateOne({ _id: user._id }, { totpSecret: user.pendingTotpSecret, totpEnabled: true, emergencyBackupCodes: codes, pendingTotpSecret: '', pendingBackupCodes: [] });
        const sessionToken = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        await UserRepo.updateOne({ _id: user._id }, { lastLogin: new Date() });
        await SecurityLogRepo.create({ event: `Authenticator enrollment completed for ${user.email}`, status: 'success', ip: req.ip || '', device: req.headers['user-agent'] || '', location: '', method: 'TOTP Enrollment' });
        res.json({ success: true, token: sessionToken, user: { email: user.email, name: user.name, role: user.role, biometricRegistered: user.biometricRegistered } });
    } catch { res.status(500).json({ msg: 'Could not complete authenticator setup.' }); }
});

// 3. Step 2: Two-Factor Authentication Verification
app.post('/api/auth/verify-2fa', async (req, res) => {
    try {
        const { email, code, method, tempToken } = req.body;
        if (!email) {
            res.status(400).json({ msg: 'Email is required.' });
            return;
        }
        // Verify temp token
        if (tempToken) {
            try {
                const decodedChallenge = jwt.verify(tempToken, JWT_SECRET);
                if (decodedChallenge.step !== '2fa_required' || decodedChallenge.email !== email.trim().toLowerCase()) throw new Error('Invalid challenge');
            }
            catch {
                res.status(401).json({ msg: '2FA session expired. Please re-enter password.' });
                return;
            }
        }
        const cleanEmail = email.trim().toLowerCase();
        const user = await UserRepo.findOne({ email: cleanEmail });
        if (!user) {
            res.status(404).json({ msg: 'User not found in database.' });
            return;
        }
        if (user.totpEnabled !== true) { res.status(409).json({ msg: 'Authenticator setup is required before login.', requiresSetup: true }); return; }
        let isValid = false;
        if (method === 'totp') {
            isValid = verifyTotp(String(code || '').trim(), user.totpSecret);
        }
        else if (method === 'biometric' || method === 'google_push') {
            res.status(501).json({ msg: 'This verification method is not configured. Use an authenticator code or a backup code.' });
            return;
        }
        else if (method === 'backup_code') {
            const clean = (code || '').trim().toUpperCase();
            const codes = user.emergencyBackupCodes || [];
            const idx = codes.findIndex((c) => c.replace('-', '') === clean.replace('-', ''));
            if (idx !== -1) {
                isValid = true;
                // Invalidate used code in database
                codes.splice(idx, 1);
                await UserRepo.updateOne({ email: cleanEmail }, { emergencyBackupCodes: codes });
            }
        }
        if (!isValid) {
            res.status(400).json({ msg: 'Invalid two-factor verification code.' });
            return;
        }
        // Issue Final Session Token
        const sessionToken = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        // Update lastLogin in database
        await UserRepo.updateOne({ email: cleanEmail }, { lastLogin: new Date() });
        await SecurityLogRepo.create({
            event: `Two-Factor Authentication Verified (${method}) for ${cleanEmail}`,
            status: 'success',
            ip: req.ip || '127.0.0.1',
            device: req.headers['user-agent'] || 'Mobile',
            location: 'Authorized Device',
            method: `2FA (${method})`,
            details: 'Full Admin Session Granted',
        });
        res.json({
            success: true,
            token: sessionToken,
            user: {
                email: user.email,
                name: user.name,
                role: user.role,
                isGoogleVerified: user.isGoogleVerified,
                emergencyBackupCodes: user.emergencyBackupCodes,
                biometricRegistered: user.biometricRegistered,
                verifiedDeviceName: user.verifiedDeviceName,
            },
        });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ msg: 'Failed to verify 2FA.', error: msg });
    }
});
// 4. Update Admin Profile / 2FA Secrets in Database
app.put('/api/auth/profile', authenticateJWT, async (req, res) => {
    try {
        const authUser = req.user;
        const { name, totpSecret, emergencyBackupCodes, biometricRegistered, newPassword } = req.body;
        const updateFields = {};
        if (name)
            updateFields.name = name.trim();
        if (totpSecret)
            updateFields.totpSecret = totpSecret.trim();
        if (emergencyBackupCodes)
            updateFields.emergencyBackupCodes = emergencyBackupCodes;
        if (typeof biometricRegistered === 'boolean')
            updateFields.biometricRegistered = biometricRegistered;
        if (newPassword && newPassword.length >= 6) {
            updateFields.passwordHash = await bcrypt.hash(newPassword, 10);
        }
        const updated = await UserRepo.updateOne({ email: authUser.email }, updateFields);
        res.json({ msg: 'Profile updated in database successfully.', user: updated });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ msg: 'Failed to update profile.', error: msg });
    }
});
/* ----------------------------------------------------
 * ADMIN ACCOUNT MANAGEMENT (authenticated admins only)
 * ---------------------------------------------------- */
app.get('/api/admins', authenticateJWT, async (_req, res) => {
  try { res.json(await UserRepo.findAdmins()); }
  catch { res.status(500).json({ msg: 'Failed to load admin accounts.' }); }
});

app.post('/api/admins', authenticateJWT, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail) || typeof password !== 'string' || password.length < 12 || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ msg: 'Provide a valid email, name, and password (at least 12 characters). The new admin can sign in with their email and password.' }); return;
    }
    if (await UserRepo.findOne({ email: cleanEmail })) { res.status(409).json({ msg: 'An admin with this email already exists.' }); return; }
    const created = await UserRepo.create({ email: cleanEmail, name: name.trim(), passwordHash: await bcrypt.hash(password, 12), role: 'admin', totpSecret: '', totpEnabled: false, emergencyBackupCodes: [], biometricRegistered: false, verifiedDeviceName: 'Admin Device' });
    await SecurityLogRepo.create({ event: `Admin account created: ${cleanEmail}`, status: 'success', ip: req.ip || '', device: req.headers['user-agent'] || '', location: '', method: 'Authenticated Admin Management' });
    res.status(201).json({ _id: created._id, email: created.email, name: created.name, role: created.role, createdAt: created.createdAt });
  } catch { res.status(500).json({ msg: 'Failed to create admin account.' }); }
});

app.post('/api/admins/:id/reset-authenticator', authenticateJWT, async (req, res) => {
  try {
    if (String(req.user.id) === String(req.params.id)) return res.status(400).json({ msg: 'Use the documented server-side recovery procedure to reset your own locked-out authenticator.' });
    const target = await UserRepo.findOne({ _id: req.params.id });
    if (!target) return res.status(404).json({ msg: 'Admin account not found.' });
    await UserRepo.updateOne({ _id: target._id }, { totpSecret: '', totpEnabled: false, emergencyBackupCodes: [], pendingTotpSecret: '', pendingBackupCodes: [] });
    await SecurityLogRepo.create({ event: `Authenticator reset for ${target.email} by ${req.user.email}`, status: 'warning', ip: req.ip || '', device: req.headers['user-agent'] || '', location: '', method: 'Authenticated Admin Recovery' });
    res.json({ msg: 'Authenticator reset. The admin must sign in with their password and complete setup again.' });
  } catch { res.status(500).json({ msg: 'Could not reset authenticator.' }); }
});

app.delete('/api/admins/:id', authenticateJWT, async (req, res) => {
  try {
    if (String(req.user.id) === String(req.params.id)) { res.status(400).json({ msg: 'You cannot delete your own admin account.' }); return; }
    const target = await UserRepo.findOne({ _id: req.params.id });
    if (!target) { res.status(404).json({ msg: 'Admin account not found.' }); return; }
    if (await UserRepo.countDocuments() <= 1) { res.status(400).json({ msg: 'The last admin account cannot be deleted.' }); return; }
    await UserRepo.deleteById(req.params.id);
    await SecurityLogRepo.create({ event: `Admin account deleted: ${target.email}`, status: 'warning', ip: req.ip || '', device: req.headers['user-agent'] || '', location: '', method: 'Authenticated Admin Management' });
    res.json({ msg: 'Admin account deleted.' });
  } catch { res.status(500).json({ msg: 'Failed to delete admin account.' }); }
});

/* ----------------------------------------------------
 * LEADS API (EMPTY BY DEFAULT - REAL MONGODB DATA)
 * ---------------------------------------------------- */
app.get('/api/leads', authenticateJWT, async (_req, res) => {
    try {
        const leads = await LeadRepo.find();
        res.json(leads);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ msg: 'Failed to load leads from database.', error: msg });
    }
});
app.post('/api/leads', authenticateJWT, async (req, res) => {
    try {
        const { name, email, phone, message, status, requirements, paymentAmount, advancePayment, service, eventDate } = req.body;
        if (!name || !phone) {
            res.status(400).json({ msg: 'Client name and phone are required.' });
            return;
        }
        const newLead = await LeadRepo.create({
            name: name.trim(),
            email: (email || '').trim(),
            phone: phone.trim(),
            message: (message || '').trim(),
            status: status || 'new',
            requirements: (requirements || '').trim(),
            paymentAmount: (paymentAmount || '').trim(),
            advancePayment: (advancePayment || '').trim(),
            service: service || 'Wedding Photography',
            eventDate: eventDate || '',
        });
        res.status(201).json(newLead);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ msg: 'Failed to save lead in database.', error: msg });
    }
});
app.put('/api/leads/:id', authenticateJWT, async (req, res) => {
    try {
        const updated = await LeadRepo.findByIdAndUpdate(req.params.id, req.body);
        if (!updated) {
            res.status(404).json({ msg: 'Lead not found in database.' });
            return;
        }
        res.json(updated);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ msg: 'Failed to update lead.', error: msg });
    }
});
app.delete('/api/leads/:id', authenticateJWT, async (req, res) => {
    try {
        await LeadRepo.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Lead deleted from database successfully.' });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ msg: 'Failed to delete lead.', error: msg });
    }
});
/* ----------------------------------------------------
 * CLOUDINARY PROJECT PHOTO UPLOAD
 * The browser sends a compressed data URL; Cloudinary stores the image,
 * and the returned secure URL is saved in the project's images array.
 * ---------------------------------------------------- */
app.post('/api/projects/upload-image', authenticateJWT, async (req, res) => {
    try {
        const { dataUrl } = req.body || {};
        if (typeof dataUrl !== 'string' || !/^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(dataUrl)) {
            res.status(400).json({ msg: 'A valid image file is required.' });
            return;
        }
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            res.status(503).json({ msg: 'Photo upload is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to the backend environment.' });
            return;
        }
        const result = await cloudinary.uploader.upload(dataUrl, {
            folder: 'endless-moment/projects',
            resource_type: 'image',
        });
        res.status(201).json({ imageUrl: result.secure_url, publicId: result.public_id });
    } catch (err) {
        console.error('Cloudinary project photo upload failed:', err instanceof Error ? err.message : err);
        res.status(502).json({ msg: 'Could not upload photo to Cloudinary. Please try again.' });
    }
});

/* ----------------------------------------------------
 * PROJECTS API (EMPTY BY DEFAULT - REAL MONGODB DATA)
 * ---------------------------------------------------- */
app.get('/api/projects', authenticateJWT, async (_req, res) => {
    try {
        const projects = await ProjectRepo.find();
        res.json(projects);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ msg: 'Failed to load projects from database.', error: msg });
    }
});
app.post('/api/projects', authenticateJWT, async (req, res) => {
    try {
        const { title, description, category, images, clientName, shootDate, location, featured } = req.body;
        if (!title || !description) {
            res.status(400).json({ msg: 'Project title and description are required.' });
            return;
        }
        const newProject = await ProjectRepo.create({
            title: title.trim(),
            description: description.trim(),
            category: category || 'wedding',
            images: Array.isArray(images) ? images : [],
            clientName: (clientName || '').trim(),
            shootDate: shootDate || '',
            location: (location || '').trim(),
            featured: Boolean(featured),
        });
        res.status(201).json(newProject);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ msg: 'Failed to save project in database.', error: msg });
    }
});
app.put('/api/projects/:id', authenticateJWT, async (req, res) => {
    try {
        const updated = await ProjectRepo.findByIdAndUpdate(req.params.id, req.body);
        if (!updated) {
            res.status(404).json({ msg: 'Project not found in database.' });
            return;
        }
        res.json(updated);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ msg: 'Failed to update project.', error: msg });
    }
});
app.delete('/api/projects/:id', authenticateJWT, async (req, res) => {
    try {
        await ProjectRepo.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Project deleted from database successfully.' });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ msg: 'Failed to delete project.', error: msg });
    }
});
/* ----------------------------------------------------
 * INVOICES API (MongoDB persistence; never local device storage)
 * ---------------------------------------------------- */
app.get('/api/invoices', authenticateJWT, async (_req, res) => {
    try {
        res.json(await InvoiceRepo.find());
    }
    catch (err) {
        res.status(500).json({ msg: 'Failed to load invoices.', error: err instanceof Error ? err.message : String(err) });
    }
});
app.post('/api/invoices', authenticateJWT, async (req, res) => {
    try {
        const { leadId, clientName, clientEmail, clientPhone, invoiceDate, service, description, total, advance, notes } = req.body;
        if (!leadId || !clientName || !invoiceDate || !service) {
            res.status(400).json({ msg: 'Client, invoice date and service are required.' });
            return;
        }
        const lead = await LeadRepo.findById(String(leadId));
        if (!lead || lead.status !== 'converted') {
            res.status(400).json({ msg: 'Invoices can only be generated for completed/converted clients.' });
            return;
        }
        const amount = Number(total), paid = Number(advance || 0);
        if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(paid) || paid < 0 || paid > amount) {
            res.status(400).json({ msg: 'Invoice total must be positive and advance must be between zero and the total.' });
            return;
        }
        const invoiceNumber = `EM-${new Date().getFullYear()}-${Date.now().toString().slice(-7)}`;
        const invoice = await InvoiceRepo.create({
            invoiceNumber, leadId: String(leadId), clientName: String(clientName).trim(),
            clientEmail: String(clientEmail || ''), clientPhone: String(clientPhone || ''), invoiceDate: String(invoiceDate),
            service: String(service).trim(), description: String(description || ''), total: amount, advance: paid, notes: String(notes || ''),
        });
        res.status(201).json(invoice);
    }
    catch (err) {
        res.status(500).json({ msg: 'Failed to save invoice.', error: err instanceof Error ? err.message : String(err) });
    }
});
/* ----------------------------------------------------
 * SECURITY LOGS API
 * ---------------------------------------------------- */
app.get('/api/security/logs', authenticateJWT, async (_req, res) => {
    try {
        const logs = await SecurityLogRepo.find(40);
        res.json(logs);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ msg: 'Failed to load security logs.', error: msg });
    }
});
app.use('/api', (_req, res) => res.status(404).json({ msg: 'API endpoint not found.' }));
/* ----------------------------------------------------
 * VITE MIDDLEWARE (DEV) & STATIC FILES (PROD)
 * ---------------------------------------------------- */
async function startServer() {
    const httpServer = http.createServer(app);
    if (process.env.NODE_ENV === 'production') {
        // When DEPLOY_FRONTEND=false, Render runs API-only and Netlify serves the frontend.
        if (process.env.DEPLOY_FRONTEND !== 'false') {
            app.use(express.static(path.resolve(__dirname, 'dist')));
            app.get('*', (_req, res) => {
                res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
            });
        }
    }
    else {
        const { createServer: createViteServer } = await import('vite');
        const isHmrDisabled = process.env.DISABLE_HMR === 'true';
        const vite = await createViteServer({
            server: {
                middlewareMode: true,
                hmr: isHmrDisabled ? false : { server: httpServer },
            },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    }
    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Endless Moment Full-Stack Server running at http://0.0.0.0:${PORT}`);
    });
}
startServer();
