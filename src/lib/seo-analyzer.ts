import { countWords, stripHtml } from "./utils";

export type SeoCheckStatus = "good" | "warning" | "bad";

export interface SeoCheckResult {
  id: string;
  label: string;
  detail: string;
  status: SeoCheckStatus;
  score: number;
  maxScore: number;
  category: "seo" | "readability";
}

export interface SeoAnalysisReport {
  overallScore: number;
  seoScore: number;
  readabilityScore: number;
  status: SeoCheckStatus;
  wordCount: number;
  keywordDensity: number;
  checks: SeoCheckResult[];
}

export interface SeoInput {
  title: string;
  seoTitle?: string;
  slug: string;
  seoDescription?: string;
  excerpt?: string;
  focusKeyword?: string;
  contentHtml: string;
  coverImage?: string;
  coverImageAlt?: string;
}

export function analyzeSeo(input: SeoInput): SeoAnalysisReport {
  const effectiveTitle = (input.seoTitle || input.title || "").trim();
  const effectiveDescription = (
    input.seoDescription ||
    input.excerpt ||
    ""
  ).trim();
  const keyword = (input.focusKeyword || "").trim().toLowerCase();
  const slug = (input.slug || "").trim().toLowerCase();
  const plainText = stripHtml(input.contentHtml || "");
  const plainLower = plainText.toLowerCase();
  const wordCount = countWords(input.contentHtml || "");

  const checks: SeoCheckResult[] = [];

  // 1. Focus Keyword definita
  if (!keyword) {
    checks.push({
      id: "focus-keyword",
      label: "Focus Keyword non impostata",
      detail:
        "Inserisci una parola chiave principale (Focus Keyword) per attivare l'analisi mirata su titolo, URL e paragrafi.",
      status: "bad",
      score: 0,
      maxScore: 15,
      category: "seo",
    });
  } else {
    checks.push({
      id: "focus-keyword",
      label: `Focus Keyword attiva: "${input.focusKeyword}"`,
      detail: "La parola chiave principale è definita correttamente.",
      status: "good",
      score: 15,
      maxScore: 15,
      category: "seo",
    });
  }

  // 2. Lunghezza Meta Title
  const titleLen = effectiveTitle.length;
  if (titleLen >= 40 && titleLen <= 62) {
    checks.push({
      id: "title-length",
      label: `Lunghezza Titolo SEO ottimale (${titleLen}/60 caratteri)`,
      detail:
        "Il titolo ha la lunghezza ideale per la SERP di Google senza essere troncato.",
      status: "good",
      score: 12,
      maxScore: 12,
      category: "seo",
    });
  } else if (titleLen >= 25 && titleLen <= 72) {
    checks.push({
      id: "title-length",
      label: `Lunghezza Titolo SEO accettabile (${titleLen}/60 caratteri)`,
      detail:
        titleLen < 40
          ? "Il titolo è un po' corto: punta a 45-60 caratteri per massimizzare il CTR."
          : "Il titolo supera i 60 caratteri e potrebbe essere troncato su alcuni schermi.",
      status: "warning",
      score: 7,
      maxScore: 12,
      category: "seo",
    });
  } else {
    checks.push({
      id: "title-length",
      label: `Lunghezza Titolo SEO fuori range (${titleLen}/60 caratteri)`,
      detail:
        "Imposta un Titolo SEO compreso tra 40 e 60 caratteri per una visualizzazione ottimale su Google.",
      status: "bad",
      score: 2,
      maxScore: 12,
      category: "seo",
    });
  }

  // 3. Keyword nel Titolo SEO
  if (keyword) {
    const titleLower = effectiveTitle.toLowerCase();
    if (titleLower.startsWith(keyword)) {
      checks.push({
        id: "keyword-in-title",
        label: "Focus Keyword all'inizio del Titolo SEO",
        detail:
          "Ottimo! La parola chiave è posizionata all'inizio del titolo SEO.",
        status: "good",
        score: 13,
        maxScore: 13,
        category: "seo",
      });
    } else if (titleLower.includes(keyword)) {
      checks.push({
        id: "keyword-in-title",
        label: "Focus Keyword presente nel Titolo SEO",
        detail:
          "La keyword è presente nel titolo SEO (posizionarla più vicino all'inizio dà un ulteriore vantaggio).",
        status: "good",
        score: 11,
        maxScore: 13,
        category: "seo",
      });
    } else {
      checks.push({
        id: "keyword-in-title",
        label: "Focus Keyword assente nel Titolo SEO",
        detail: `Includi "${input.focusKeyword}" nel Titolo SEO della pagina.`,
        status: "bad",
        score: 0,
        maxScore: 13,
        category: "seo",
      });
    }
  }

  // 4. Lunghezza Meta Description
  const descLen = effectiveDescription.length;
  if (descLen >= 120 && descLen <= 160) {
    checks.push({
      id: "desc-length",
      label: `Meta Description ottimale (${descLen}/160 caratteri)`,
      detail:
        "La descrizione rientra perfettamente nei limiti della SERP di Google.",
      status: "good",
      score: 12,
      maxScore: 12,
      category: "seo",
    });
  } else if (descLen >= 70 && descLen <= 185) {
    checks.push({
      id: "desc-length",
      label: `Meta Description migliorabile (${descLen}/160 caratteri)`,
      detail:
        "Consigliamo una lunghezza tra 120 e 160 caratteri per massimizzare il tasso di clic.",
      status: "warning",
      score: 7,
      maxScore: 12,
      category: "seo",
    });
  } else {
    checks.push({
      id: "desc-length",
      label: `Meta Description mancante o fuori scala (${descLen}/160 caratteri)`,
      detail:
        "Scrivi una Meta Description persuasiva tra 120 e 160 caratteri.",
      status: "bad",
      score: 0,
      maxScore: 12,
      category: "seo",
    });
  }

  // 5. Keyword nella Meta Description & nello Slug
  if (keyword) {
    const inDesc = effectiveDescription.toLowerCase().includes(keyword);
    const keywordSlug = keyword.replace(/\s+/g, "-");
    const inSlug = slug.includes(keywordSlug) || slug.includes(keyword);

    checks.push({
      id: "keyword-in-desc",
      label: inDesc
        ? "Focus Keyword presente nella Meta Description"
        : "Focus Keyword assente nella Meta Description",
      detail: inDesc
        ? "Google evidenzierà in grassetto la keyword nello snippet di ricerca."
        : `Aggiungi "${input.focusKeyword}" nella Meta Description.`,
      status: inDesc ? "good" : "warning",
      score: inDesc ? 8 : 2,
      maxScore: 8,
      category: "seo",
    });

    checks.push({
      id: "keyword-in-slug",
      label: inSlug
        ? "Focus Keyword presente nell'URL (Slug)"
        : "Focus Keyword non rilevata nello Slug URL",
      detail: inSlug
        ? "Lo slug URL è parlante e contiene la keyword principale."
        : "Valuta di includere la keyword principale nello slug dell'articolo.",
      status: inSlug ? "good" : "warning",
      score: inSlug ? 8 : 3,
      maxScore: 8,
      category: "seo",
    });
  }

  // 6. Keyword nel primo paragrafo e Densità
  let keywordDensity = 0;
  if (keyword && wordCount > 0) {
    const regex = new RegExp(
      keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi"
    );
    const matches = plainLower.match(regex);
    const count = matches ? matches.length : 0;
    const keywordWords = keyword.split(/\s+/).length;
    keywordDensity = parseFloat(
      (((count * keywordWords) / wordCount) * 100).toFixed(2)
    );

    const firstParagraphMatch = (input.contentHtml || "").match(
      /<p[^>]*>([\s\S]*?)<\/p>/i
    );
    const firstParaText = firstParagraphMatch
      ? stripHtml(firstParagraphMatch[1]).toLowerCase()
      : plainLower.slice(0, 300);

    const inIntro = firstParaText.includes(keyword);
    checks.push({
      id: "keyword-in-intro",
      label: inIntro
        ? "Focus Keyword presente nell'introduzione"
        : "Focus Keyword assente nel primo paragrafo",
      detail: inIntro
        ? "Il tema principale viene chiarito subito nel primo paragrafo."
        : "Inserisci la Focus Keyword già nel primo paragrafo dell'articolo.",
      status: inIntro ? "good" : "warning",
      score: inIntro ? 8 : 2,
      maxScore: 8,
      category: "seo",
    });

    if (keywordDensity >= 0.5 && keywordDensity <= 2.8) {
      checks.push({
        id: "keyword-density",
        label: `Densità Keyword equilibrata (${keywordDensity}% — ${count} occorrenze)`,
        detail:
          "La frequenza della keyword è naturale e ottimale per i motori di ricerca.",
        status: "good",
        score: 8,
        maxScore: 8,
        category: "seo",
      });
    } else if (count > 0) {
      checks.push({
        id: "keyword-density",
        label: `Densità Keyword da calibrare (${keywordDensity}% — ${count} occorrenze)`,
        detail:
          keywordDensity < 0.5
            ? "Usa la keyword o i suoi sinonimi qualche volta in più nel corpo del testo (target 0.5% - 2.5%)."
            : "Attenzione al keyword stuffing: riduci leggermente le ripetizioni della keyword.",
        status: "warning",
        score: 4,
        maxScore: 8,
        category: "seo",
      });
    } else {
      checks.push({
        id: "keyword-density",
        label: "Focus Keyword mai usata nel corpo del testo",
        detail: "Includi la parola chiave all'interno dei paragrafi dell'articolo.",
        status: "bad",
        score: 0,
        maxScore: 8,
        category: "seo",
      });
    }
  }

  // 7. Immagine di copertina e attributo ALT
  const hasCover = Boolean(input.coverImage);
  const hasCoverAlt = Boolean((input.coverImageAlt || "").trim());
  if (hasCover && hasCoverAlt) {
    checks.push({
      id: "image-alt",
      label: "Immagine in evidenza e testo alternativo (ALT) presenti",
      detail:
        "Ottimo per Google Immagini, accessibilità screen-reader e condivisione OpenGraph.",
      status: "good",
      score: 8,
      maxScore: 8,
      category: "seo",
    });
  } else if (hasCover) {
    checks.push({
      id: "image-alt",
      label: "Manca il testo ALT dell'immagine di copertina",
      detail:
        "Compila l'attributo ALT dell'immagine in evidenza per migliorare accessibilità e SEO.",
      status: "warning",
      score: 4,
      maxScore: 8,
      category: "seo",
    });
  } else {
    checks.push({
      id: "image-alt",
      label: "Immagine di copertina non selezionata",
      detail:
        "Aggiungi un'immagine in evidenza con testo ALT per aumentare il CTR sui social e Google Discover.",
      status: "bad",
      score: 0,
      maxScore: 8,
      category: "seo",
    });
  }

  // 8. Leggibilità: Lunghezza del contenuto
  if (wordCount >= 300) {
    checks.push({
      id: "word-count",
      label: `Lunghezza articolo solida (${wordCount} parole)`,
      detail:
        "Il contenuto supera la soglia minima consigliata di 300 parole per l'indicizzazione approfondita.",
      status: "good",
      score: 8,
      maxScore: 8,
      category: "readability",
    });
  } else if (wordCount >= 150) {
    checks.push({
      id: "word-count",
      label: `Articolo piuttosto breve (${wordCount}/300 parole consigliate)`,
      detail:
        "Espandi l'argomento fino ad almeno 300 parole per posizionarti meglio.",
      status: "warning",
      score: 4,
      maxScore: 8,
      category: "readability",
    });
  } else {
    checks.push({
      id: "word-count",
      label: `Contenuto troppo corto (${wordCount}/300 parole)`,
      detail: "I contenuti sotto le 150 parole faticano a posizionarsi su Google.",
      status: "bad",
      score: 1,
      maxScore: 8,
      category: "readability",
    });
  }

  // 9. Leggibilità: Struttura Sottotitoli H2 / H3
  const subheadings = (input.contentHtml || "").match(/<h[23][^>]*>/gi) || [];
  if (subheadings.length >= 2) {
    checks.push({
      id: "subheadings",
      label: `Ottima gerarchia di sottotitoli (${subheadings.length} H2/H3)`,
      detail:
        "I sottotitoli H2/H3 facilitano la scansione rapida del testo e generano l'indice automatico.",
      status: "good",
      score: 8,
      maxScore: 8,
      category: "readability",
    });
  } else if (subheadings.length === 1) {
    checks.push({
      id: "subheadings",
      label: "Un solo sottotitolo H2/H3 presente",
      detail:
        "Suddividi il testo con almeno 2 sottotitoli H2/H3 per migliorare la leggibilità.",
      status: "warning",
      score: 4,
      maxScore: 8,
      category: "readability",
    });
  } else {
    checks.push({
      id: "subheadings",
      label: "Nessun sottotitolo H2/H3 trovato",
      detail:
        "Inserisci titoli H2 e H3 per strutturare l'articolo e attivare l'Indice dei Contenuti.",
      status: "bad",
      score: 0,
      maxScore: 8,
      category: "readability",
    });
  }

  const totalScore = checks.reduce((acc, c) => acc + c.score, 0);
  const totalMax = checks.reduce((acc, c) => acc + c.maxScore, 0);
  const overallScore =
    totalMax > 0 ? Math.min(100, Math.round((totalScore / totalMax) * 100)) : 0;

  const seoChecks = checks.filter((c) => c.category === "seo");
  const readChecks = checks.filter((c) => c.category === "readability");

  const seoScore =
    seoChecks.reduce((a, c) => a + c.maxScore, 0) > 0
      ? Math.round(
          (seoChecks.reduce((a, c) => a + c.score, 0) /
            seoChecks.reduce((a, c) => a + c.maxScore, 0)) *
            100
        )
      : 0;

  const readabilityScore =
    readChecks.reduce((a, c) => a + c.maxScore, 0) > 0
      ? Math.round(
          (readChecks.reduce((a, c) => a + c.score, 0) /
            readChecks.reduce((a, c) => a + c.maxScore, 0)) *
            100
        )
      : 0;

  const status: SeoCheckStatus =
    overallScore >= 75 ? "good" : overallScore >= 45 ? "warning" : "bad";

  return {
    overallScore,
    seoScore,
    readabilityScore,
    status,
    wordCount,
    keywordDensity,
    checks,
  };
}

export function buildArticleJsonLd(params: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  authorName: string;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  schemaType?: string;
  siteName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": params.schemaType || "BlogPosting",
    headline: params.title,
    description: params.description,
    image: params.imageUrl ? [params.imageUrl] : undefined,
    datePublished: params.publishedAt
      ? new Date(params.publishedAt).toISOString()
      : new Date().toISOString(),
    dateModified: params.updatedAt
      ? new Date(params.updatedAt).toISOString()
      : new Date().toISOString(),
    author: {
      "@type": "Person",
      name: params.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: params.siteName,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": params.url,
    },
  };
}

