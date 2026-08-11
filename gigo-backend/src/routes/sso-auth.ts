import express, { Request, Response } from 'express';
import { db } from '../firebase-config';
import { google } from 'googleapis';
import axios from 'axios';
import { generateToken } from '../utils/auth';

const router = express.Router();

// ----------------------------------------------------
// GOOGLE SIGN-IN
// Reuses the same GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env vars as the
// Gmail-connect flow in mailroom.ts — one GCP OAuth client can serve both,
// just with different scopes/redirect purposes.
// ----------------------------------------------------

router.get('/auth/google/url', async (req: Request, res: Response) => {
  try {
    const client_id = process.env.GOOGLE_CLIENT_ID || '1047125301880-mock.apps.googleusercontent.com';
    const client_secret = process.env.GOOGLE_CLIENT_SECRET || 'mock-client-secret';
    const redirect_uri = process.env.GOOGLE_LOGIN_REDIRECT_URI || 'http://localhost:5173/sso-callback/google';

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
    const url = oauth2Client.generateAuthUrl({
      access_type: 'online',
      prompt: 'select_account',
      scope: ['openid', 'email', 'profile']
    });

    res.status(200).json({ url });
  } catch (error: any) {
    console.error("Failed to generate Google Sign-In URL:", error);
    res.status(500).json({ error: "Failed to generate Google Sign-In link." });
  }
});

router.post('/auth/google/callback', async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: "Authorization code is required." });
    return;
  }

  try {
    const client_id = process.env.GOOGLE_CLIENT_ID || '1047125301880-mock.apps.googleusercontent.com';
    const client_secret = process.env.GOOGLE_CLIENT_SECRET || 'mock-client-secret';
    const redirect_uri = process.env.GOOGLE_LOGIN_REDIRECT_URI || 'http://localhost:5173/sso-callback/google';

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.id_token) {
      res.status(502).json({ error: "Google did not return an identity token." });
      return;
    }

    const ticket = await oauth2Client.verifyIdToken({ idToken: tokens.id_token, audience: client_id });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      res.status(502).json({ error: "Google identity token did not include an email address." });
      return;
    }

    const { userId, isNewUser } = await findOrCreateUserByEmail(payload.email, payload.name || '');
    const token = generateToken(userId);
    res.status(200).json({ userId, token, isNewUser, email: payload.email });
  } catch (error: any) {
    console.error("Google Sign-In callback failed:", error);
    res.status(500).json({ error: "Google Sign-In failed.", details: error.message });
  }
});

// ----------------------------------------------------
// LINKEDIN SIGN-IN (OpenID Connect)
// Requires a LinkedIn Developer app with "Sign In with LinkedIn using OpenID
// Connect" product added — set LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET.
// ----------------------------------------------------

router.get('/auth/linkedin/url', async (req: Request, res: Response) => {
  const client_id = process.env.LINKEDIN_CLIENT_ID;
  if (!client_id) {
    res.status(503).json({ error: "LinkedIn Sign-In is not configured on this server yet." });
    return;
  }
  const redirect_uri = process.env.LINKEDIN_LOGIN_REDIRECT_URI || 'http://localhost:5173/sso-callback/linkedin';
  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent('openid profile email')}`;
  res.status(200).json({ url });
});

router.post('/auth/linkedin/callback', async (req: Request, res: Response) => {
  const { code } = req.body;
  const client_id = process.env.LINKEDIN_CLIENT_ID;
  const client_secret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    res.status(503).json({ error: "LinkedIn Sign-In is not configured on this server yet." });
    return;
  }
  if (!code) {
    res.status(400).json({ error: "Authorization code is required." });
    return;
  }

  try {
    const redirect_uri = process.env.LINKEDIN_LOGIN_REDIRECT_URI || 'http://localhost:5173/sso-callback/linkedin';
    const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      client_id,
      client_secret
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const idToken = tokenRes.data.id_token;
    if (!idToken) {
      res.status(502).json({ error: "LinkedIn did not return an identity token." });
      return;
    }
    // The id_token is a signed JWT; decode the payload (LinkedIn's OIDC keys are
    // validated at token-exchange time over TLS, so a lightweight decode is used here).
    const payloadJson = Buffer.from(idToken.split('.')[1], 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);

    if (!payload.email) {
      res.status(502).json({ error: "LinkedIn identity token did not include an email address." });
      return;
    }

    const { userId, isNewUser } = await findOrCreateUserByEmail(payload.email, payload.name || '');
    const token = generateToken(userId);
    res.status(200).json({ userId, token, isNewUser, email: payload.email });
  } catch (error: any) {
    console.error("LinkedIn Sign-In callback failed:", error);
    res.status(500).json({ error: "LinkedIn Sign-In failed.", details: error.message });
  }
});

// ----------------------------------------------------
// APPLE SIGN-IN — not implemented.
// Requires a paid Apple Developer Program membership, a registered Services
// ID, and a JWT client secret signed with an ES256 private key (regenerated
// every 6 months). Flag to the user rather than building a non-functional flow.
// ----------------------------------------------------

router.get('/auth/apple/url', async (req: Request, res: Response) => {
  res.status(503).json({ error: "Sign in with Apple requires an Apple Developer Program account and is not set up yet." });
});

/**
 * Finds an existing candidate by email, or creates a minimal new profile.
 * Shared by every SSO provider so login/signup behavior stays consistent.
 */
async function findOrCreateUserByEmail(email: string, fullName: string): Promise<{ userId: string; isNewUser: boolean }> {
  const existing = await db.collection('users').where('email', '==', email).limit(1).get();
  if (!existing.empty) {
    return { userId: existing.docs[0].id, isNewUser: false };
  }

  const userId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  await db.collection('users').doc(userId).set({
    userId,
    email,
    fullName: fullName || '',
    role: 'candidate',
    hasVoiceOnboarded: false,
    createdAt: new Date().toISOString()
  });
  return { userId, isNewUser: true };
}

export default router;
