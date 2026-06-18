// ============================================================
// Contact Form API – Hardened Serverless Function
// ============================================================
// Security: rate limiting, input sanitization, size limits,
//           method enforcement, CORS restriction, honeypot check
// ============================================================

// --- In-memory rate limiter (per Vercel function instance) ---
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;      // max 5 per minute per IP

function isRateLimited(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { windowStart: now, count: 1 });
        return false;
    }

    entry.count++;
    if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }
    return false;
}

// Periodically clean stale entries (prevents memory leak)
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
        if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
            rateLimitMap.delete(ip);
        }
    }
}, RATE_LIMIT_WINDOW_MS * 2);

// --- Input sanitization ---
function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}

function isValidEmail(email) {
    // RFC 5322 simplified — blocks injection attempts
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return re.test(email) && email.length <= 254;
}

// --- Handler ---
export default function handler(req, res) {
    // ── Security headers on every response ──
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Content-Type', 'application/json');

    // ── CORS – restrict to same origin (no wildcard) ──
    const allowedOrigins = [
        'https://portfolio-psi-rust-77.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173'
    ];
    const origin = req.headers.origin || '';
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');

    // ── Preflight ──
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // ── Method enforcement ──
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Rate limiting ──
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.headers['x-real-ip']
        || req.socket?.remoteAddress
        || 'unknown';

    if (isRateLimited(clientIp)) {
        return res.status(429).json({
            error: 'Too many requests. Please wait a moment before trying again.'
        });
    }

    // ── Body size check ──
    const rawBody = JSON.stringify(req.body || {});
    if (rawBody.length > 5000) {
        return res.status(413).json({ error: 'Payload too large' });
    }

    // ── Extract & validate fields ──
    const { name, email, message, _honeypot } = req.body || {};

    // Honeypot trap – bots fill hidden fields
    if (_honeypot) {
        // Silently accept but discard (don't tip off the bot)
        return res.status(200).json({ success: true, message: 'Message received successfully!' });
    }

    // Required fields
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields (name, email, message) are required.' });
    }

    // Type check
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
        return res.status(400).json({ error: 'Invalid field types.' });
    }

    // Length limits
    if (name.length > 100) {
        return res.status(400).json({ error: 'Name must be under 100 characters.' });
    }
    if (email.length > 254) {
        return res.status(400).json({ error: 'Email must be under 254 characters.' });
    }
    if (message.length > 2000) {
        return res.status(400).json({ error: 'Message must be under 2000 characters.' });
    }

    // Email format validation
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }

    // ── Sanitize all inputs ──
    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email);
    const cleanMessage = sanitize(message);

    // ── Log (safe, sanitized) ──
    console.log('\n--- New Contact Submission ---');
    console.log(`IP: ${clientIp}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Name: ${cleanName}`);
    console.log(`Email: ${cleanEmail}`);
    console.log(`Message: ${cleanMessage}`);
    console.log('------------------------------\n');

    // In production, integrate with an email service (SendGrid, Resend, etc.)
    // or a database (Supabase, Firebase, etc.) to store submissions.

    res.status(200).json({ success: true, message: 'Message received successfully!' });
}
