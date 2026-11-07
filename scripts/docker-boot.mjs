import { execSync, spawn } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

async function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
    console.log("🔗 [PancakeCMS Boot] DATABASE_URL esterno rilevato.");
    return process.env.DATABASE_URL;
  }

  console.log(
    "⚙️ [PancakeCMS Boot] Nessun DATABASE_URL configurato in Coolify: avvio PostgreSQL integrato nel container..."
  );

  const pgDataDir = "/app/public/uploads/.pgdata";
  const pgRunDir = "/run/postgresql";

  await fs.mkdir(pgRunDir, { recursive: true });
  execSync(`chown -R postgres:postgres ${pgRunDir}`, { stdio: "inherit" });

  if (!fsSync.existsSync(path.join(pgDataDir, "PG_VERSION"))) {
    console.log("📦 [PancakeCMS Boot] Inizializzazione cluster PostgreSQL locale...");
    await fs.mkdir(pgDataDir, { recursive: true });
    execSync(`chown -R postgres:postgres ${pgDataDir}`, { stdio: "inherit" });
    execSync(`chmod 700 ${pgDataDir}`, { stdio: "inherit" });
    execSync(
      `su-exec postgres initdb -D ${pgDataDir} -U postgres --auth=trust --encoding=UTF8`,
      { stdio: "inherit" }
    );
  } else {
    execSync(`chown -R postgres:postgres ${pgDataDir}`, { stdio: "inherit" });
    execSync(`chmod 700 ${pgDataDir}`, { stdio: "inherit" });
  }

  console.log("▶️ [PancakeCMS Boot] Avvio demone PostgreSQL locale...");
  execSync(
    `su-exec postgres pg_ctl -D ${pgDataDir} -l /tmp/postgres.log -w start`,
    { stdio: "inherit" }
  );

  try {
    execSync(`su-exec postgres createdb -h 127.0.0.1 -U postgres pancakecms_db`, {
      stdio: "ignore",
    });
  } catch {
    // Il database pancakecms_db esiste già
  }

  const fallbackUrl =
    "postgresql://postgres@127.0.0.1:5432/pancakecms_db?schema=public";
  process.env.DATABASE_URL = fallbackUrl;
  return fallbackUrl;
}

async function boot() {
  console.log("🚀 [PancakeCMS Boot] Verifica directory uploads persistente...");
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const dbUrl = await ensureDatabaseUrl();
  const childEnv = { ...process.env, DATABASE_URL: dbUrl };

  console.log("🗄️ [PancakeCMS Boot] Sincronizzazione schema Prisma su PostgreSQL...");
  execSync("npx prisma db push --skip-generate", {
    stdio: "inherit",
    env: childEnv,
  });

  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    const userCount = await prisma.user.count();
    if (userCount === 0 || process.env.FORCE_SEED === "true") {
      console.log(
        "🌱 [PancakeCMS Boot] Database vuoto rilevato (primo avvio su Coolify): popolamento dati iniziali e immagini WebP..."
      );
      execSync("npx tsx prisma/seed.ts", {
        stdio: "inherit",
        env: childEnv,
      });
    } else {
      console.log(
        `✅ [PancakeCMS Boot] Database già inizializzato (${userCount} utenti presenti). Seed saltato.`
      );
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log("🌐 [PancakeCMS Boot] Avvio server Next.js sulla porta " + (process.env.PORT || "3000") + "...");
  const nextProc = spawn(
    "npx",
    ["next", "start", "-H", "0.0.0.0", "-p", process.env.PORT || "3000"],
    {
      stdio: "inherit",
      env: childEnv,
    }
  );

  nextProc.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

boot().catch((err) => {
  console.error("❌ [PancakeCMS Boot] Errore critico di avvio:", err);
  process.exit(1);
});
