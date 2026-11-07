import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

async function boot() {
  console.log("🚀 [PancakeCMS Boot] Verifica directory uploads persistente...");
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  console.log("🗄️ [PancakeCMS Boot] Sincronizzazione schema Prisma su PostgreSQL...");
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });

  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0 || process.env.FORCE_SEED === "true") {
      console.log(
        "🌱 [PancakeCMS Boot] Database vuoto rilevato (primo avvio su Coolify): popolamento dati iniziali e immagini WebP..."
      );
      execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
    } else {
      console.log(
        `✅ [PancakeCMS Boot] Database già inizializzato (${userCount} utenti presenti). Seed saltato.`
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

boot().catch((err) => {
  console.error("❌ [PancakeCMS Boot] Errore critico di avvio:", err);
  process.exit(1);
});
