import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'WA_SECURE_JWT_SECRET_KEY_98765';

/**
 * Generates a zero-dependency signature-verified session token.
 * Payload structure: userId.expiry
 * Complete Token: userId.expiry.signature
 */
export function generateToken(userId: string): string {
  const timestamp = Date.now();
  // 30-day token lifetime
  const expiry = timestamp + 30 * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${expiry}`;
  const hmac = crypto.createHmac('sha256', JWT_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return `${payload}.${signature}`;
}

/**
 * Decodes and verifies the session token.
 * Returns verified userId if valid, or null if expired or signature is invalid.
 */
export function verifyToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [userId, expiryStr, signature] = parts;
    const expiry = parseInt(expiryStr, 10);
    if (Date.now() > expiry) {
      console.warn(`[Auth verification] Token has expired for user: ${userId}`);
      return null;
    }

    const payload = `${userId}.${expiryStr}`;
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return userId;
    }
  } catch (err: any) {
    console.error("[Auth verification] verification error:", err.message);
  }
  return null;
}

/**
 * Express Authentication Middleware.
 * Adds verified userId to express request.
 * Fully backwards-compatible: falls back to parameters if Authorization header is missing.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (token) {
    const verifiedUserId = verifyToken(token);
    if (verifiedUserId) {
      (req as any).userId = verifiedUserId;
      return next();
    } else {
      res.status(403).json({ error: "Invalid or expired session token." });
      return;
    }
  }

  // Backwards compatibility fallback check for userId in request params, query, or body
  const rawUserId = req.params.userId || req.body.userId || req.query.userId;
  if (rawUserId) {
    (req as any).userId = String(rawUserId);
    return next();
  }

  res.status(401).json({ error: "Access denied. Authentication token or userId is required." });
}
