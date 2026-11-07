import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  PENDING_2FA_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifyPending2FAToken,
  verifyTwoFactorCode,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    const pendingToken = req.cookies.get(PENDING_2FA_COOKIE_NAME)?.value;

    if (!pendingToken) {
      return NextResponse.json(
        { error: "Sessione 2FA scaduta. Effettua nuovamente il login." },
        { status: 401 }
      );
    }

    const userId = await verifyPending2FAToken(pendingToken);
    if (!userId) {
      return NextResponse.json(
        { error: "Token 2FA non valido o scaduto." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Utente non trovato o 2FA non configurato." },
        { status: 400 }
      );
    }

    const inputCode = String(code || "").trim().toUpperCase();
    let isValid = verifyTwoFactorCode(user.twoFactorSecret, inputCode);

    // Controllo Codici di Recupero (Backup Codes)
    let updatedBackupCodes: string[] | null = null;
    if (!isValid && user.backupCodes) {
      try {
        const parsedCodes: string[] = JSON.parse(user.backupCodes);
        const idx = parsedCodes.findIndex((c) => c.toUpperCase() === inputCode);
        if (idx !== -1) {
          isValid = true;
          parsedCodes.splice(idx, 1);
          updatedBackupCodes = parsedCodes;
        }
      } catch {
        // ignore parse error
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Codice 2FA o codice di recupero non valido." },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        ...(updatedBackupCodes
          ? { backupCodes: JSON.stringify(updatedBackupCodes) }
          : {}),
      },
    });

    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    res.cookies.delete(PENDING_2FA_COOKIE_NAME);
    res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error("Verify 2FA error:", err);
    return NextResponse.json(
      { error: "Errore durante la verifica del codice 2FA." },
      { status: 500 }
    );
  }
}

