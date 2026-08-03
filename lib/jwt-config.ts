// lib/jwt-config.ts
// Use a safe development fallback so the app does not crash during boot
// when a local runtime does not yet have JWT_SECRET configured.
export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me';