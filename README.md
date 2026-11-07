# 🥞 PancakeCMS — CMS Editoriale & Blog Full-Stack (Alternativa Moderna a WordPress)

Un CMS completo e veloce sviluppato con **Next.js (App Router) + TypeScript + PostgreSQL (Prisma ORM) + Tiptap WYSIWYG + Sharp**.

## Funzionalità Implementate
- **Editor WYSIWYG Tiptap (Stile Notion/Ghost)**: barra strumenti fissa, blocchi rapidi `/`, titoli H1-H3 con generazione automatica dell'**Indice dei Contenuti (TOC)**, tabelle, callout box, citazioni, embed YouTube, contatore parole/tempo di lettura, salvataggio bozze, programmazione uscite (`SCHEDULED`) e **Storico Revisioni** con ripristino in 1 click.
- **Suite SEO in Tempo Reale (Stile Yoast / RankMath)**: analisi semaforo 0-100 su Focus Keyword, densità keyword, leggibilità, anteprima interattiva **Google SERP (Desktop & Mobile)**, anteprima **Social Card OpenGraph**, Canonical URL, `noindex`/`nofollow`, **Schema.org JSON-LD** automatico, `/sitemap.xml`, `/robots.txt` e **Gestore Redirect 301/302** (incluso redirect automatico se cambi lo slug di un articolo pubblicato).
- **Gestione Tag Google Analytics 4, GTM & Cookie Banner GDPR**: pannello di controllo per `G-XXXXXXXXXX` e `GTM-XXXXXXX`, eventi automatici (`article_read_75_percent`, `post_like`, `post_bookmark`, `comment_posted`, `newsletter_signup`), iniezione script `<head>` e **Cookie Banner GDPR con Google Consent Mode v2**.
- **Libreria Media & Editor Immagini In-Browser**: conversione automatica di ogni upload in **WebP** lato server tramite `sharp`, organizzazione in cartelle, tracciamento utilizzi nei post ed **Editor Immagini visuale** (ritaglio 16:9, 4:3, 1:1, 1200×630 OG, rotazione, flip, luminosità, contrasto, saturazione, filtro caldo) con salvataggio come nuova copia o sovrascrittura.
- **Gestione Utenze, Ruoli (RBAC) & 2FA TOTP**: 4 ruoli (`ADMIN`, `EDITOR`, `AUTHOR`, `READER`), autenticazione a due fattori **2FA TOTP** tramite QR Code (Google/Microsoft Authenticator, Authy) + 8 codici di recupero, attivabile da ogni utente e forzabile dagli Admin.
- **Community Utenti-Lettori & Sezione Commenti**: registrazione lettori, articoli salvati nei segnalibri (`/account`), Mi Piace agli articoli, commenti annidati con risposte, reazioni, segnalazioni e coda di moderazione configurabile in Admin.
- **Categorie Gerarchiche, Tag Doppi & Extra Blog**: categorie padre/figlio, **Tag Pubblici** per i lettori e **Tag Interni Editoriali (`#evidenza`, `#newsletter-pick`, `#da-revisionare`)**, ricerca full-text istantanea, Feed RSS (`/feed.xml`), Newsletter e **Importatore da WordPress (WXR/XML)**.

---

## Account Demo Preconfigurati (Creazione automatica col Seed)

| Ruolo | Email | Password | Permessi |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `sara@blogdisara.it` | `SaraAdmin2026!` | Controllo completo CMS, Utenti, Impostazioni, SEO, GA4 |
| **EDITOR** | `editor@blogdisara.it` | `Editor2026!` | Tutti gli articoli, pagine, categorie, tag, media e moderazione commenti |
| **AUTHOR** | `autore@blogdisara.it` | `Autore2026!` | Scrittura e gestione dei propri articoli e caricamento media |
| **READER** | `lettore@blogdisara.it` | `Lettore2026!` | Area lettore (`/account`), commenti, like, segnalibri e 2FA personale |

---

## Avvio Rapido in Locale

```bash
# 1. Avvia il database PostgreSQL su porta 5433
docker compose up -d db

# 2. Installa le dipendenze e popola il DB con articoli e immagini WebP demo
npm install
npm run db:setup

# 3. Avvia il server di sviluppo su http://localhost:3000
npm run dev
```

## Deploy in Produzione su VPS (Docker Compose)

```bash
docker compose up -d --build
```

