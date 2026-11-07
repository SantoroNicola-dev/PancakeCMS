import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { analyzeSeo } from "../src/lib/seo-analyzer";
import { calculateReadingTime } from "../src/lib/utils";

const prisma = new PrismaClient();

async function generateDemoImages(uploadsDir: string) {
  await fs.mkdir(uploadsDir, { recursive: true });

  const demoVisuals = [
    {
      filename: "demo-hero-editorial.webp",
      title: "Scrivania editoriale minimalista con luce naturale",
      altText: "Scrivania in legno chiaro con taccuino, tazza di caffè e luce del mattino per scrittura editoriale",
      caption: "Lo spazio della scrittura lenta: meno rumore, più profondità.",
      folder: "Copertine",
      svg: `<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1e293b"/>
            <stop offset="55%" stop-color="#334155"/>
            <stop offset="100%" stop-color="#c54c3d"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="675" fill="url(#bg1)"/>
        <circle cx="950" cy="180" r="220" fill="#f8fafc" fill-opacity="0.08"/>
        <circle cx="240" cy="520" r="280" fill="#e68d82" fill-opacity="0.12"/>
        <rect x="110" y="130" width="520" height="390" rx="20" fill="#0f172a" fill-opacity="0.45" stroke="#f8fafc" stroke-opacity="0.2"/>
        <text x="160" y="250" fill="#f8fafc" font-family="Georgia, serif" font-size="48" font-weight="bold">Scrittura Digitale</text>
        <text x="160" y="315" fill="#f0b7b0" font-family="Georgia, serif" font-size="34">&amp; Cura Editoriale</text>
        <text x="160" y="395" fill="#cbd5e1" font-family="sans-serif" font-size="22">Il Blog di Sara • Magazine Indipendente</text>
      </svg>`,
    },
    {
      filename: "demo-slow-living.webp",
      title: "Rituali del mattino e slow living",
      altText: "Illustrazione editoriale dedicata allo slow living e al tempo di qualità",
      caption: "Rallentare il ritmo quotidiano per ritrovare attenzione e creatività.",
      folder: "Lifestyle",
      svg: `<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#7c2d12"/>
            <stop offset="50%" stop-color="#b45309"/>
            <stop offset="100%" stop-color="#fde68a"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="675" fill="url(#bg2)"/>
        <circle cx="880" cy="340" r="190" fill="#fffbeb" fill-opacity="0.22"/>
        <text x="120" y="310" fill="#fffbeb" font-family="Georgia, serif" font-size="54" font-weight="bold">L'Arte dello Slow Living</text>
        <text x="120" y="380" fill="#fef3c7" font-family="sans-serif" font-size="26">Ritrovare la concentrazione nell'era delle notifiche continue</text>
      </svg>`,
    },
    {
      filename: "demo-cultura-libri.webp",
      title: "Letture d'autunno e taccuini d'autore",
      altText: "Pila di libri di narrativa e saggistica con segnalibri e annotazioni a margine",
      caption: "Cinque saggi contemporanei che cambiano il modo di guardare il presente.",
      folder: "Cultura",
      svg: `<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#064e3b"/>
            <stop offset="60%" stop-color="#047857"/>
            <stop offset="100%" stop-color="#6ee7b7"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="675" fill="url(#bg3)"/>
        <rect x="760" y="120" width="280" height="420" rx="16" fill="#ecfdf5" fill-opacity="0.15"/>
        <text x="120" y="300" fill="#ecfdf5" font-family="Georgia, serif" font-size="52" font-weight="bold">Biblioteca Essenziale</text>
        <text x="120" y="370" fill="#d1fae5" font-family="sans-serif" font-size="26">Libri, saggi e mappe concettuali per menti curiose</text>
      </svg>`,
    },
    {
      filename: "demo-design-tipografia.webp",
      title: "Tipografia editoriale sul web moderno",
      altText: "Composizione tipografica serif e sans-serif per il design di blog editoriali",
      caption: "Come la scelta di un carattere tipografico trasforma l'esperienza di lettura.",
      folder: "Design",
      svg: `<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#31102f"/>
            <stop offset="50%" stop-color="#6b21a8"/>
            <stop offset="100%" stop-color="#db2777"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="675" fill="url(#bg4)"/>
        <text x="840" y="460" fill="#ffffff" fill-opacity="0.12" font-family="Georgia, serif" font-size="360" font-weight="bold">Aa</text>
        <text x="120" y="300" fill="#fdf4ff" font-family="Georgia, serif" font-size="52" font-weight="bold">Tipografia &amp; Leggibilità</text>
        <text x="120" y="370" fill="#f5d0fe" font-family="sans-serif" font-size="26">Guida al design editoriale che mette al centro il lettore</text>
      </svg>`,
    },
  ];

  const createdMedia = [];
  for (const item of demoVisuals) {
    const filePath = path.join(uploadsDir, item.filename);
    const buffer = await sharp(Buffer.from(item.svg))
      .webp({ quality: 88 })
      .toBuffer();
    await fs.writeFile(filePath, buffer);
    const meta = await sharp(buffer).metadata();
    createdMedia.push({
      filename: item.filename,
      originalName: item.filename.replace(".webp", ".png"),
      url: `/uploads/${item.filename}`,
      folder: item.folder,
      mimeType: "image/webp",
      sizeBytes: buffer.length,
      width: meta.width || 1200,
      height: meta.height || 675,
      altText: item.altText,
      title: item.title,
      caption: item.caption,
    });
  }

  return createdMedia;
}

async function main() {
  console.log("🌱 Inizializzazione seed per PancakeCMS...");

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const mediaFiles = await generateDemoImages(uploadsDir);

  // 1. Impostazioni globali del sito
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "Il Blog di Sara",
      siteTagline: "Storie, riflessioni, design e cultura digitale raccontati con cura editoriale.",
      siteDescription:
        "Un magazine indipendente dedicato a scrittura digitale, slow living, recensioni letterarie e design editoriale.",
      siteUrl: "http://localhost:3000",
      logoText: "Sara.",
      primaryColor: "#c54c3d",
      accentColor: "#1e293b",
      fontPairing: "editorial",
      heroLayout: "magazine",
      postsPerPage: 9,
      gaMeasurementId: "G-PANCAKE2026",
      gtmContainerId: "",
      enableGa4: true,
      enableCookieBanner: true,
      commentModeration: "auto",
    },
  });

  // 2. Creazione Utenti (Admin, Editor, Author, Reader)
  const saraPassword = await bcrypt.hash("SaraAdmin2026!", 10);
  const editorPassword = await bcrypt.hash("Editor2026!", 10);
  const authorPassword = await bcrypt.hash("Autore2026!", 10);
  const readerPassword = await bcrypt.hash("Lettore2026!", 10);

  const sara = await prisma.user.upsert({
    where: { email: "sara@blogdisara.it" },
    update: {},
    create: {
      name: "Sara Rossi",
      email: "sara@blogdisara.it",
      passwordHash: saraPassword,
      role: "ADMIN",
      jobTitle: "Fondatrice & Direttrice Editoriale",
      bio: "Scrittrice, progettista digitale e appassionata di carta stampata. Ho creato questo spazio per raccontare idee senza la fretta degli algoritmi.",
      avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Sara",
      isActive: true,
      twoFactorEnabled: false,
    },
  });

  const marco = await prisma.user.upsert({
    where: { email: "editor@blogdisara.it" },
    update: {},
    create: {
      name: "Marco Bianchi",
      email: "editor@blogdisara.it",
      passwordHash: editorPassword,
      role: "EDITOR",
      jobTitle: "Caporedattore & SEO Specialist",
      bio: "Curo la revisione stilistica degli articoli, il calendario editoriale e l'ottimizzazione SEO del magazine.",
      avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Marco",
      isActive: true,
    },
  });

  const elena = await prisma.user.upsert({
    where: { email: "autore@blogdisara.it" },
    update: {},
    create: {
      name: "Elena Verdi",
      email: "autore@blogdisara.it",
      passwordHash: authorPassword,
      role: "AUTHOR",
      jobTitle: "Autrice Rubrica Cultura & Libri",
      bio: "Critica letteraria e ricercatrice. Ogni settimana esploro saggi e romanzi indipendenti.",
      avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Elena",
      isActive: true,
    },
  });

  const luca = await prisma.user.upsert({
    where: { email: "lettore@blogdisara.it" },
    update: {},
    create: {
      name: "Luca Moretti",
      email: "lettore@blogdisara.it",
      passwordHash: readerPassword,
      role: "READER",
      jobTitle: "Lettore Abbonato",
      bio: "Appassionato di fotografia analogica, architettura e buone letture domenicali.",
      avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Luca",
      isActive: true,
    },
  });

  // 3. Salvataggio Media nel DB
  await prisma.media.deleteMany({});
  for (const m of mediaFiles) {
    await prisma.media.create({
      data: {
        ...m,
        uploadedById: sara.id,
      },
    });
  }

  // 4. Categorie Gerarchiche
  const catEditoriali = await prisma.category.upsert({
    where: { slug: "editoriali" },
    update: {},
    create: {
      name: "Editoriali",
      slug: "editoriali",
      description: "Riflessioni approfondite su editoria digitale, creatività e tecnologie umane.",
      color: "#c54c3d",
      seoTitle: "Editoriali e Analisi sull'Editoria Digitale | Il Blog di Sara",
      seoDescription: "Leggi gli editoriali di Sara Rossi su scrittura, media indipendenti e cultura digitale.",
      order: 1,
    },
  });

  const catCultura = await prisma.category.upsert({
    where: { slug: "cultura-libri" },
    update: {},
    create: {
      name: "Cultura & Libri",
      slug: "cultura-libri",
      description: "Recensioni letterarie, percorsi di lettura e interviste ad autori contemporanei.",
      color: "#047857",
      seoTitle: "Cultura & Libri: Recensioni e Consigli di Lettura | Il Blog di Sara",
      seoDescription: "Scopri i migliori saggi e romanzi selezionati dalla redazione.",
      order: 2,
    },
  });

  await prisma.category.upsert({
    where: { slug: "saggistica" },
    update: {},
    create: {
      name: "Saggistica Contemporanea",
      slug: "saggistica",
      description: "Sottocategoria dedicata ai saggi di filosofia, sociologia ed estetica.",
      color: "#059669",
      parentId: catCultura.id,
      order: 3,
    },
  });

  const catLifestyle = await prisma.category.upsert({
    where: { slug: "lifestyle" },
    update: {},
    create: {
      name: "Lifestyle & Slow Living",
      slug: "lifestyle",
      description: "Abitudini intenzionali, minimalismo digitale e spazi di lavoro creativi.",
      color: "#b45309",
      seoTitle: "Lifestyle Consapevole & Slow Living | Il Blog di Sara",
      seoDescription: "Idee pratiche per vivere e lavorare con più intenzionalità e meno distrazioni.",
      order: 4,
    },
  });

  const catDesign = await prisma.category.upsert({
    where: { slug: "design-tipografia" },
    update: {},
    create: {
      name: "Design & Tipografia",
      slug: "design-tipografia",
      description: "Estetica del web, architettura dell'informazione e cultura del progetto.",
      color: "#7e22ce",
      order: 5,
    },
  });

  // 5. Tag Pubblici e Tag Interni Editoriali
  const tagScrittura = await prisma.tag.upsert({
    where: { slug: "scrittura-digitale" },
    update: {},
    create: { name: "Scrittura Digitale", slug: "scrittura-digitale", color: "#c54c3d", isInternal: false },
  });
  const tagMinimalismo = await prisma.tag.upsert({
    where: { slug: "minimalismo" },
    update: {},
    create: { name: "Minimalismo", slug: "minimalismo", color: "#0f766e", isInternal: false },
  });
  const tagLetture = await prisma.tag.upsert({
    where: { slug: "consigli-lettura" },
    update: {},
    create: { name: "Consigli di Lettura", slug: "consigli-lettura", color: "#047857", isInternal: false },
  });
  const tagDesign = await prisma.tag.upsert({
    where: { slug: "web-design" },
    update: {},
    create: { name: "Web Design", slug: "web-design", color: "#6d28d9", isInternal: false },
  });

  // Tag Interni (isInternal: true)
  const tagIntEvidenza = await prisma.tag.upsert({
    where: { slug: "int-evidenza" },
    update: {},
    create: {
      name: "#evidenza",
      slug: "int-evidenza",
      description: "Tag interno: mostra l'articolo nel box Hero principale della Home",
      color: "#e11d48",
      isInternal: true,
    },
  });
  const tagIntNewsletter = await prisma.tag.upsert({
    where: { slug: "int-newsletter-pick" },
    update: {},
    create: {
      name: "#newsletter-pick",
      slug: "int-newsletter-pick",
      description: "Tag interno: selezionato per il prossimo invio della newsletter del venerdì",
      color: "#2563eb",
      isInternal: true,
    },
  });
  const tagIntRevisione = await prisma.tag.upsert({
    where: { slug: "int-da-revisionare" },
    update: {},
    create: {
      name: "#da-revisionare",
      slug: "int-da-revisionare",
      description: "Tag interno per il workflow redazionale",
      color: "#d97706",
      isInternal: true,
    },
  });

  // 6. Articoli del Blog e Pagine Statiche
  const post1Content = `
<p>Per oltre quindici anni abbiamo dato per scontato che pubblicare un blog significasse convivere con pannelli di controllo lenti, decine di plugin in conflitto tra loro e aggiornamenti di sicurezza continui. Oggi la <strong>scrittura digitale</strong> merita uno spazio più pulito, rapido e progettato intorno a chi scrive e a chi legge.</p>
<h2>Perché ripensare gli strumenti della scrittura digitale</h2>
<p>Quando apriamo un editor per buttare giù un'idea, l'interfaccia dovrebbe scomparire. Un buon CMS editoriale non costringe l'autore a combattere con shortcode o layout spezzati: offre una tipografia nitida, un controllo immediato sui metadati SEO e una gestione delle immagini che ottimizza automaticamente ogni fotografia per il web moderno.</p>
<blockquote><p>«La forma dello strumento che utilizziamo ogni giorno finisce inevitabilmente per modellare anche la qualità dei pensieri che riusciamo a esprimere.»</p></blockquote>
<h2>Leggibilità, velocità e rispetto per il lettore</h2>
<p>Un blog indipendente vive della fiducia dei suoi lettori. Pagine che si caricano istantaneamente, un indice dei contenuti chiaro, l'assenza di tracker invasivi non autorizzati e una sezione commenti ordinata trasformano una semplice visita occasionale in un appuntamento fisso.</p>
<h3>I tre pilastri di un magazine moderno</h3>
<ul>
  <li><strong>Esperienza di scrittura fluida:</strong> blocchi semantici, salvataggio rapido e storico completo delle revisioni.</li>
  <li><strong>SEO consapevole e trasparente:</strong> analisi in tempo reale di parole chiave, leggibilità, anteprima SERP Google e card social OpenGraph.</li>
  <li><strong>Proprietà dei dati e performance:</strong> immagini servite in formato WebP di nuova generazione e architettura solida su database relazionale.</li>
</ul>
<h2>Costruire una casa digitale duratura</h2>
<p>Investire nella cura della propria piattaforma di <strong>scrittura digitale</strong> significa emanciparsi dalla volatilità dei feed social. Un articolo ben strutturato continua a generare valore, conversazioni e scoperte anche a distanza di anni dalla sua pubblicazione.</p>
`.trim();

  const post1Seo = analyzeSeo({
    title: "Perché la scrittura digitale ha bisogno di spazi lenti, veloci e indipendenti",
    seoTitle: "Scrittura digitale: perché scegliere un blog indipendente e veloce",
    slug: "scrittura-digitale-spazi-indipendenti",
    seoDescription:
      "Scopri perché la scrittura digitale contemporanea richiede un CMS moderno, veloce e curato nella SEO, lontano dalla complessità dei vecchi blog.",
    focusKeyword: "scrittura digitale",
    contentHtml: post1Content,
    coverImage: "/uploads/demo-hero-editorial.webp",
    coverImageAlt: "Scrivania in legno chiaro con taccuino e luce naturale per la scrittura digitale",
  });

  const post1 = await prisma.post.upsert({
    where: { slug: "scrittura-digitale-spazi-indipendenti" },
    update: {},
    create: {
      title: "Perché la scrittura digitale ha bisogno di spazi lenti, veloci e indipendenti",
      slug: "scrittura-digitale-spazi-indipendenti",
      excerpt:
        "Abbandonare la complessità dei vecchi CMS monolitici per tornare all'essenza del blogging: tipografia curata, velocità istantanea e rapporto diretto con i lettori.",
      content: post1Content,
      coverImage: "/uploads/demo-hero-editorial.webp",
      coverImageAlt: "Scrivania in legno chiaro con taccuino e luce naturale per la scrittura digitale",
      type: "POST",
      status: "PUBLISHED",
      featured: true,
      allowComments: true,
      readingTimeMin: calculateReadingTime(post1Content),
      viewsCount: 1420,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      authorId: sara.id,
      categoryId: catEditoriali.id,
      seoTitle: "Scrittura digitale: perché scegliere un blog indipendente e veloce",
      seoDescription:
        "Scopri perché la scrittura digitale contemporanea richiede un CMS moderno, veloce e curato nella SEO, lontano dalla complessità dei vecchi blog.",
      focusKeyword: "scrittura digitale",
      ogTitle: "Perché la scrittura digitale ha bisogno di spazi indipendenti",
      ogDescription: "Un manifesto per il ritorno ai blog curati, veloci e liberi dal rumore degli algoritmi.",
      ogImage: "/uploads/demo-hero-editorial.webp",
      seoScore: post1Seo.overallScore,
      tags: {
        connect: [
          { id: tagScrittura.id },
          { id: tagMinimalismo.id },
          { id: tagIntEvidenza.id },
          { id: tagIntNewsletter.id },
        ],
      },
    },
  });

  const post2Content = `
<p>Viviamo immersi in un flusso ininterrotto di notifiche, email urgenti e messaggi istantanei che frammentano la nostra giornata in segmenti di pochi minuti. Praticare lo <strong>slow living</strong> nel lavoro creativo non significa produrre meno, ma proteggere con determinazione la qualità della propria attenzione.</p>
<h2>Il mito del multitasking creativo</h2>
<p>Le neuroscienze lo confermano da tempo: ogni volta che spostiamo lo sguardo da una bozza a una notifica sullo smartphone, il nostro cervello impiega fino a venti minuti per recuperare la stessa profondità di immersione. Creare rituali quotidiani di disconnessione è diventato un atto necessario.</p>
<h2>Tre abitudini di slow living per chi lavora con le idee</h2>
<p>Non serve trasferirsi in una baita isolata per cambiare ritmo. Bastano piccoli confini progettati con cura all'interno della propria settimana lavorativa:</p>
<h3>1. Le prime due ore senza schermi reattivi</h3>
<p>Dedicare l'inizio della giornata alla lettura su carta, alla scrittura su taccuino o alla stesura del pezzo più impegnativo prima ancora di aprire la casella di posta trasforma radicalmente l'umore e la lucidità mentale.</p>
<h3>2. Curare l'ergonomia visiva del proprio spazio</h3>
<p>Uno spazio di lavoro essenziale, illuminato da luce naturale e libero da oggetti superflui, riduce il carico cognitivo invisibile e favorisce uno stato di quiete operativa tipico dello <strong>slow living</strong>.</p>
`.trim();

  const post2Seo = analyzeSeo({
    title: "L'arte dello Slow Living applicata al lavoro creativo e quotidiano",
    seoTitle: "Slow Living e lavoro creativo: guida pratica per ritrovare focus",
    slug: "slow-living-lavoro-creativo",
    seoDescription:
      "Come applicare i principi dello slow living alla routine lavorativa quotidiana per proteggere l'attenzione, ridurre lo stress digitale e scrivere meglio.",
    focusKeyword: "slow living",
    contentHtml: post2Content,
    coverImage: "/uploads/demo-slow-living.webp",
    coverImageAlt: "Illustrazione editoriale dedicata allo slow living",
  });

  const post2 = await prisma.post.upsert({
    where: { slug: "slow-living-lavoro-creativo" },
    update: {},
    create: {
      title: "L'arte dello Slow Living applicata al lavoro creativo e quotidiano",
      slug: "slow-living-lavoro-creativo",
      excerpt:
        "Come difendere spazi di silenzio e concentrazione profonda in un ecosistema lavorativo progettato per l'interruzione continua.",
      content: post2Content,
      coverImage: "/uploads/demo-slow-living.webp",
      coverImageAlt: "Illustrazione editoriale dedicata allo slow living",
      type: "POST",
      status: "PUBLISHED",
      featured: false,
      allowComments: true,
      readingTimeMin: calculateReadingTime(post2Content),
      viewsCount: 980,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
      authorId: sara.id,
      categoryId: catLifestyle.id,
      seoTitle: "Slow Living e lavoro creativo: guida pratica per ritrovare focus",
      seoDescription:
        "Come applicare i principi dello slow living alla routine lavorativa quotidiana per proteggere l'attenzione, ridurre lo stress digitale e scrivere meglio.",
      focusKeyword: "slow living",
      ogImage: "/uploads/demo-slow-living.webp",
      seoScore: post2Seo.overallScore,
      tags: {
        connect: [{ id: tagMinimalismo.id }, { id: tagIntNewsletter.id }],
      },
    },
  });

  const post3Content = `
<p>Ogni stagione porta con sé domande nuove e il desiderio di rallentare attraverso le pagine giuste. In questa selezione di <strong>consigli di lettura</strong> abbiamo raccolto cinque opere tra saggistica narrativa, filosofia del paesaggio e storia della cultura visiva che meritano un posto sul comodino.</p>
<h2>Perché leggere saggistica d'autore oggi</h2>
<p>A differenza dei riassunti veloci che circolano online, un buon saggio accompagna il lettore lungo il ragionamento completo dell'autore, mostrando le sfumature, i dubbi e le connessioni inattese tra discipline lontane.</p>
<h2>I cinque titoli selezionati dalla redazione</h2>
<p>Dai classici riscoperti alle nuove voci dell'editoria indipendente italiana ed europea, questi <strong>consigli di lettura</strong> sono pensati per chi cerca libri capaci di restare nella memoria a lungo e di aprire nuove piste di ricerca personale.</p>
<h3>Come organizzare un taccuino delle letture</h3>
<p>Affiancare a ogni libro una scheda sintetica con le citazioni chiave e i rimandi bibliografici permette di costruire nel tempo un vero e proprio archivio personale delle idee.</p>
`.trim();

  const post3Seo = analyzeSeo({
    title: "Cinque saggi luminosi per comprendere il presente: i nostri consigli di lettura",
    seoTitle: "Consigli di lettura: 5 saggi imperdibili per capire il presente",
    slug: "consigli-di-lettura-saggi-presente",
    seoDescription:
      "I nostri consigli di lettura del mese: cinque saggi contemporanei su cultura, paesaggio e pensiero critico scelti dalla redazione.",
    focusKeyword: "consigli di lettura",
    contentHtml: post3Content,
    coverImage: "/uploads/demo-cultura-libri.webp",
    coverImageAlt: "Pila di libri di saggistica con segnalibri",
  });

  await prisma.post.upsert({
    where: { slug: "consigli-di-lettura-saggi-presente" },
    update: {},
    create: {
      title: "Cinque saggi luminosi per comprendere il presente: i nostri consigli di lettura",
      slug: "consigli-di-lettura-saggi-presente",
      excerpt:
        "Una bussola letteraria tra saggistica d'autore, estetica contemporanea e taccuini di viaggio per nutrire la curiosità.",
      content: post3Content,
      coverImage: "/uploads/demo-cultura-libri.webp",
      coverImageAlt: "Pila di libri di saggistica con segnalibri",
      type: "POST",
      status: "PUBLISHED",
      featured: false,
      allowComments: true,
      readingTimeMin: calculateReadingTime(post3Content),
      viewsCount: 745,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 140),
      authorId: elena.id,
      categoryId: catCultura.id,
      seoTitle: "Consigli di lettura: 5 saggi imperdibili per capire il presente",
      seoDescription:
        "I nostri consigli di lettura del mese: cinque saggi contemporanei su cultura, paesaggio e pensiero critico scelti dalla redazione.",
      focusKeyword: "consigli di lettura",
      ogImage: "/uploads/demo-cultura-libri.webp",
      seoScore: post3Seo.overallScore,
      tags: {
        connect: [{ id: tagLetture.id }],
      },
    },
  });

  const post4Content = `
<p>Il novanta per cento delle informazioni sul web è costituito da testo scritto, eppure la <strong>tipografia editoriale</strong> viene spesso trattata come un dettaglio secondario. Scegliere con cura gerarchie visive, interlinea, giustezza della colonna e contrasto cromatico significa rispettare gli occhi del lettore.</p>
<h2>Le regole d'oro della tipografia editoriale su schermo</h2>
<p>Una riga di testo troppo lunga affatica lo sguardo nel passaggio da un capoverso all'altro; una riga troppo stretta spezza continuamente il ritmo della frase. La misura ideale per un articolo oscilla tra i 60 e i 75 caratteri per riga.</p>
<h2>Abbinare caratteri Serif e Sans-Serif</h2>
<p>L'accostamento tra un carattere graziato autorevole per i titoli e il corpo dell'articolo e un lineare geometrico nitido per l'interfaccia, i metadati e i pulsanti crea un equilibrio perfetto tra calore della rivista cartacea e precisione digitale nella <strong>tipografia editoriale</strong>.</p>
`.trim();

  const post4Seo = analyzeSeo({
    title: "Tipografia editoriale sul web: progettare il piacere della lettura",
    seoTitle: "Tipografia editoriale sul web: guida a font, gerarchie e leggibilità",
    slug: "tipografia-editoriale-web-design",
    seoDescription:
      "Guida pratica alla tipografia editoriale per blog e magazine digitali: come scegliere font, interlinea e proporzioni per una lettura perfetta.",
    focusKeyword: "tipografia editoriale",
    contentHtml: post4Content,
    coverImage: "/uploads/demo-design-tipografia.webp",
    coverImageAlt: "Composizione tipografica serif e sans-serif",
  });

  await prisma.post.upsert({
    where: { slug: "tipografia-editoriale-web-design" },
    update: {},
    create: {
      title: "Tipografia editoriale sul web: progettare il piacere della lettura",
      slug: "tipografia-editoriale-web-design",
      excerpt:
        "Dalla scelta dei caratteri graziati alla misura ideale della colonna di testo: tutti i segreti per rendere un blog accogliente come un libro ben stampato.",
      content: post4Content,
      coverImage: "/uploads/demo-design-tipografia.webp",
      coverImageAlt: "Composizione tipografica serif e sans-serif",
      type: "POST",
      status: "PUBLISHED",
      featured: true,
      allowComments: true,
      readingTimeMin: calculateReadingTime(post4Content),
      viewsCount: 612,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 190),
      authorId: marco.id,
      categoryId: catDesign.id,
      seoTitle: "Tipografia editoriale sul web: guida a font, gerarchie e leggibilità",
      seoDescription:
        "Guida pratica alla tipografia editoriale per blog e magazine digitali: come scegliere font, interlinea e proporzioni per una lettura perfetta.",
      focusKeyword: "tipografia editoriale",
      ogImage: "/uploads/demo-design-tipografia.webp",
      seoScore: post4Seo.overallScore,
      tags: {
        connect: [{ id: tagDesign.id }, { id: tagIntRevisione.id }],
      },
    },
  });

  // Articolo Programmato (SCHEDULED) per mostrare il calendario editoriale
  await prisma.post.upsert({
    where: { slug: "fotografia-analogica-racconto-quotidiano" },
    update: {},
    create: {
      title: "Fotografia lenta: raccontare il quotidiano con trentasei pose",
      slug: "fotografia-analogica-racconto-quotidiano",
      excerpt:
        "Cosa succede al nostro sguardo quando non possiamo controllare immediatamente lo scatto sullo schermo?",
      content: `<p>Un articolo in uscita la prossima settimana dedicato al rapporto tra attesa, luce naturale e narrazione visiva.</p><h2>Il valore dell'attesa</h2><p>Aspettare lo sviluppo del rullino educa l'occhio alla sintesi.</p>`,
      coverImage: "/uploads/demo-slow-living.webp",
      coverImageAlt: "Luce calda del pomeriggio per fotografia analogica",
      type: "POST",
      status: "SCHEDULED",
      scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 72),
      readingTimeMin: 3,
      authorId: sara.id,
      categoryId: catLifestyle.id,
      focusKeyword: "fotografia lenta",
      seoScore: 78,
      tags: {
        connect: [{ id: tagIntRevisione.id }],
      },
    },
  });

  // Pagine Statiche (PAGE)
  await prisma.post.upsert({
    where: { slug: "chi-sono" },
    update: {},
    create: {
      title: "Chi Sono & Manifesto del Blog",
      slug: "chi-sono",
      excerpt: "La storia dietro Il Blog di Sara, la redazione e la nostra filosofia editoriale.",
      content: `
<p>Ciao! Sono <strong>Sara Rossi</strong> e questo è il mio spazio digitale indipendente, progettato su misura per superare i limiti dei vecchi blog tradizionali e rimettere al centro la qualità della scrittura e il dialogo con chi legge.</p>
<h2>Perché nasce questo progetto</h2>
<p>Credo in un web fatto di voci autentiche, approfondimenti curati e rispetto per il tempo e la privacy dei lettori. Qui trovi saggi brevi, note di design, consigli di lettura e riflessioni sullo stile di vita contemporaneo.</p>
<h2>La Redazione</h2>
<p>Accanto ai miei editoriali ospitiamo le rubriche di <strong>Marco Bianchi</strong> (Design &amp; SEO) ed <strong>Elena Verdi</strong> (Cultura &amp; Libri).</p>
`.trim(),
      type: "PAGE",
      status: "PUBLISHED",
      allowComments: false,
      readingTimeMin: 2,
      publishedAt: new Date(),
      authorId: sara.id,
      seoTitle: "Chi Sono — Il Blog di Sara",
      seoDescription: "Scopri la storia e il manifesto editoriale de Il Blog di Sara.",
      schemaType: "WebPage",
      seoScore: 88,
    },
  });

  await prisma.post.upsert({
    where: { slug: "privacy-policy" },
    update: {},
    create: {
      title: "Informativa Privacy & Cookie Policy (GDPR)",
      slug: "privacy-policy",
      excerpt: "Trasparenza totale su come trattiamo i dati personali, i commenti e le statistiche Google Analytics 4.",
      content: `
<p>La tua privacy è fondamentale. Questo sito utilizza esclusivamente cookie tecnici essenziali per l'autenticazione sicura (inclusa la verifica a due fattori 2FA) e, solo previo tuo consenso esplicito tramite il banner dedicato, cookie analitici di <strong>Google Analytics 4</strong> configurati con <em>Google Consent Mode v2</em> e anonimizzazione IP.</p>
<h2>Diritti degli Utenti e Lettori Registrati</h2>
<p>Gli utenti registrati possono in qualsiasi momento modificare il proprio profilo, gestire i propri commenti, consultare i propri articoli salvati o richiedere la cancellazione dell'account.</p>
`.trim(),
      type: "PAGE",
      status: "PUBLISHED",
      allowComments: false,
      readingTimeMin: 2,
      publishedAt: new Date(),
      authorId: sara.id,
      seoTitle: "Privacy & Cookie Policy | Il Blog di Sara",
      seoDescription: "Informativa sul trattamento dei dati personali e gestione dei cookie conforme al GDPR.",
      schemaType: "WebPage",
      seoScore: 85,
    },
  });

  // 7. Revisione storica demo sul primo articolo
  await prisma.postRevision.deleteMany({ where: { postId: post1.id } });
  await prisma.postRevision.create({
    data: {
      postId: post1.id,
      authorId: sara.id,
      title: "Perché la scrittura digitale ha bisogno di spazi indipendenti (Prima stesura)",
      excerpt: "Prima bozza dell'editoriale inaugurale del nuovo CMS.",
      content: "<p>Prima stesura dell'articolo con appunti iniziali sulla transizione da WordPress al nuovo CMS su misura.</p>",
      note: "Stesura iniziale salvata prima della revisione SEO",
    },
  });

  // 8. Commenti annidati demo
  await prisma.comment.deleteMany({ where: { postId: post1.id } });
  const parentComment = await prisma.comment.create({
    data: {
      postId: post1.id,
      userId: luca.id,
      content:
        "Articolo illuminante Sara! Si percepisce subito la differenza di velocità e pulizia tipografica rispetto al vecchio sito su WordPress. Bellissima anche la possibilità di salvare gli articoli nei preferiti.",
      status: "APPROVED",
      likesCount: 5,
    },
  });

  await prisma.comment.create({
    data: {
      postId: post1.id,
      userId: sara.id,
      parentId: parentComment.id,
      content:
        "Grazie mille Luca! L'obiettivo era proprio creare una casa digitale veloce, leggibile e piacevole sia per chi scrive sia per chi partecipa alle discussioni nei commenti.",
      status: "APPROVED",
      likesCount: 3,
    },
  });

  await prisma.comment.create({
    data: {
      postId: post2.id,
      userId: luca.id,
      content:
        "Da quando ho iniziato a tenere lo smartphone fuori dalla scrivania nelle prime due ore del mattino, la qualità della scrittura è cambiata completamente.",
      status: "APPROVED",
      likesCount: 2,
    },
  });

  // 9. Like, Segnalibri, Redirect 301 e Iscritti Newsletter
  await prisma.postLike.upsert({
    where: { postId_userId: { postId: post1.id, userId: luca.id } },
    update: {},
    create: { postId: post1.id, userId: luca.id },
  });

  await prisma.bookmark.upsert({
    where: { postId_userId: { postId: post1.id, userId: luca.id } },
    update: {},
    create: { postId: post1.id, userId: luca.id },
  });

  await prisma.redirect.upsert({
    where: { sourcePath: "/2025/10/vecchio-articolo-wordpress" },
    update: {},
    create: {
      sourcePath: "/2025/10/vecchio-articolo-wordpress",
      destinationPath: "/articolo/scrittura-digitale-spazi-indipendenti",
      statusCode: 301,
      hits: 42,
      isActive: true,
    },
  });

  await prisma.newsletterSubscriber.upsert({
    where: { email: "lettore@blogdisara.it" },
    update: {},
    create: {
      email: "lettore@blogdisara.it",
      name: "Luca Moretti",
      source: "home-box",
    },
  });

  await prisma.newsletterSubscriber.upsert({
    where: { email: "chiara.ferrari@example.it" },
    update: {},
    create: {
      email: "chiara.ferrari@example.it",
      name: "Chiara Ferrari",
      source: "footer",
    },
  });

  console.log("✅ Seed completato con successo!");
}

main()
  .catch((e) => {
    console.error("Errore durante il seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

