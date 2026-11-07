import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pancakecms-super-secret-jwt-key-change-in-production-2026"
);

export const SESSION_COOKIE_NAME = "pancakecms_session";
export const PENDING_2FA_COOKIE_NAME = "pancakecms_pending_2fa";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  twoFactorEnabled: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function createPending2FAToken(userId: string): Promise<string> {
  return new SignJWT({ userId, stage: "pending_2fa" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(JWT_SECRET);
}

export async function verifyPending2FAToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.stage === "pending_2fa" && typeof payload.userId === "string") {
      return payload.userId;
    }
    return null;
  } catch {
    return null;
  }
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.userId || !payload.role) return null;
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as Role,
      twoFactorEnabled: Boolean(payload.twoFactorEnabled),
    };
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      avatarUrl: true,
      jobTitle: true,
      isActive: true,
      twoFactorEnabled: true,
      forceTwoFactor: true,
      createdAt: true,
    },
  });

  if (!user || !user.isActive) return null;
  return user;
}

// RBAC Helpers
export function canAccessAdmin(role: Role): boolean {
  return role === "ADMIN" || role === "EDITOR" || role === "AUTHOR";
}

export function canManageAllContent(role: Role): boolean {
  return role === "ADMIN" || role === "EDITOR";
}

export function canManageTaxonomies(role: Role): boolean {
  return role === "ADMIN" || role === "EDITOR";
}

export function canModerateComments(role: Role): boolean {
  return role === "ADMIN" || role === "EDITOR";
}

export function canManageUsers(role: Role): boolean {
  return role === "ADMIN";
}

export function canManageSettings(role: Role): boolean {
  return role === "ADMIN";
}

// 2FA TOTP Helpers (RFC 6238)
export async function generateTwoFactorSetup(email: string, issuer = "PancakeCMS") {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  const otpauthUri = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
    width: 240,
    margin: 2,
  });

  const backupCodes = Array.from({ length: 8 }, () =>
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );

  return {
    secretBase32: secret.base32,
    otpauthUri,
    qrCodeDataUrl,
    backupCodes,
  };
}

export function verifyTwoFactorCode(secretBase32: string, token: string): boolean {
  const cleanToken = token.replace(/\s+/g, "").trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });

  const delta = totp.validate({ token: cleanToken, window: 1 });
  return delta !== null;
}

