import { NextRequest, NextResponse } from "next/server";
import {
  generateTwoFactorSetup,
  getSessionUser,
  verifyTwoFactorCode,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/auth/2fa -> action: "setup" | "enable" | "disable"
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, code } = body;

    if (action === "setup") {
      const setup = await generateTwoFactorSetup(user.email, "PancakeCMS");
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: setup.secretBase32,
          backupCodes: JSON.stringify(setup.backupCodes),
        },
      });
      return NextResponse.json({
        secretBase32: setup.secretBase32,
        qrCodeDataUrl: setup.qrCodeDataUrl,
        backupCodes: setup.backupCodes,
      });
    }

    if (action === "enable") {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!dbUser || !dbUser.twoFactorSecret) {
        return NextResponse.json(
          { error: "Avvia prima la configurazione del QR Code 2FA." },
          { status: 400 }
        );
      }

      const valid = verifyTwoFactorCode(dbUser.twoFactorSecret, String(code || ""));
      if (!valid) {
        return NextResponse.json(
          { error: "Codice di verifica a 6 cifre non valido. Riprova dall'app Authenticator." },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true },
      });

      return NextResponse.json({
        success: true,
        twoFactorEnabled: true,
      });
    }

    if (action === "disable") {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: null,
        },
      });
      return NextResponse.json({
        success: true,
        twoFactorEnabled: false,
      });
    }

    return NextResponse.json({ error: "Azione non supportata." }, { status: 400 });
  } catch (err) {
    console.error("2FA route error:", err);
    return NextResponse.json(
      { error: "Errore nella gestione del 2FA." },
      { status: 500 }
    );
  }
}

