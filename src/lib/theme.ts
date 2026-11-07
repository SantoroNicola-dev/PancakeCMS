export interface ThemePreset {
  id: string;
  name: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  bgLightColor: string;
  surfaceLightColor: string;
  textLightColor: string;
  bgDarkColor: string;
  surfaceDarkColor: string;
  textDarkColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadiusStyle: "sharp" | "subtle" | "rounded" | "pill";
  cardStyle: "bordered" | "elevated" | "flat" | "glass";
  navbarStyle: "classic" | "centered" | "minimal" | "floating";
  heroLayout: "magazine" | "spotlight" | "minimal" | "dual" | "none";
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "terracotta",
    name: "Terracotta Editoriale",
    tagline: "Caldo, letterario e accogliente (Default)",
    primaryColor: "#c54c3d",
    accentColor: "#1e293b",
    bgLightColor: "#ffffff",
    surfaceLightColor: "#ffffff",
    textLightColor: "#0f172a",
    bgDarkColor: "#020617",
    surfaceDarkColor: "#0f172a",
    textDarkColor: "#f1f5f9",
    headingFont: "Georgia",
    bodyFont: "Inter",
    borderRadiusStyle: "rounded",
    cardStyle: "bordered",
    navbarStyle: "classic",
    heroLayout: "magazine",
  },
  {
    id: "vogue-noir",
    name: "Vogue Noir & Oro",
    tagline: "Alta moda, contrasto netto e grazie classiche",
    primaryColor: "#b48a3e",
    accentColor: "#111111",
    bgLightColor: "#fcfbf9",
    surfaceLightColor: "#ffffff",
    textLightColor: "#111111",
    bgDarkColor: "#09090b",
    surfaceDarkColor: "#141417",
    textDarkColor: "#fafafa",
    headingFont: "Playfair Display",
    bodyFont: "Plus Jakarta Sans",
    borderRadiusStyle: "sharp",
    cardStyle: "bordered",
    navbarStyle: "centered",
    heroLayout: "spotlight",
  },
  {
    id: "nordic-sage",
    name: "Foresta Nordica & Salvia",
    tagline: "Slow living, natura, carta avorio e verde bosco",
    primaryColor: "#2d6a4f",
    accentColor: "#344e41",
    bgLightColor: "#f8f7f3",
    surfaceLightColor: "#ffffff",
    textLightColor: "#1b2621",
    bgDarkColor: "#07120e",
    surfaceDarkColor: "#0f221b",
    textDarkColor: "#ecfdf5",
    headingFont: "Lora",
    bodyFont: "DM Sans",
    borderRadiusStyle: "rounded",
    cardStyle: "elevated",
    navbarStyle: "classic",
    heroLayout: "magazine",
  },
  {
    id: "ocean-indigo",
    name: "Oceano & Indaco",
    tagline: "Tecnologia, saggistica contemporanea e chiarezza",
    primaryColor: "#2563eb",
    accentColor: "#0f172a",
    bgLightColor: "#f8fafc",
    surfaceLightColor: "#ffffff",
    textLightColor: "#0f172a",
    bgDarkColor: "#020617",
    surfaceDarkColor: "#0f172a",
    textDarkColor: "#f1f5f9",
    headingFont: "Plus Jakarta Sans",
    bodyFont: "Inter",
    borderRadiusStyle: "rounded",
    cardStyle: "elevated",
    navbarStyle: "floating",
    heroLayout: "dual",
  },
  {
    id: "lavender-plum",
    name: "Lavanda & Prugna",
    tagline: "Creatività, cultura visiva e morbidezza",
    primaryColor: "#7e22ce",
    accentColor: "#3b0764",
    bgLightColor: "#fdfaff",
    surfaceLightColor: "#ffffff",
    textLightColor: "#1e102a",
    bgDarkColor: "#0d0614",
    surfaceDarkColor: "#190d26",
    textDarkColor: "#f5f3ff",
    headingFont: "Cormorant Garamond",
    bodyFont: "Plus Jakarta Sans",
    borderRadiusStyle: "pill",
    cardStyle: "glass",
    navbarStyle: "floating",
    heroLayout: "magazine",
  },
  {
    id: "espresso-paper",
    name: "Caffè & Pergamena",
    tagline: "Taccuino d'autore, atmosfera da libreria storica",
    primaryColor: "#9a3412",
    accentColor: "#431407",
    bgLightColor: "#faf6f0",
    surfaceLightColor: "#fffdfa",
    textLightColor: "#291d16",
    bgDarkColor: "#120c09",
    surfaceDarkColor: "#1f1510",
    textDarkColor: "#f5ebe4",
    headingFont: "Merriweather",
    bodyFont: "Lora",
    borderRadiusStyle: "subtle",
    cardStyle: "bordered",
    navbarStyle: "centered",
    heroLayout: "minimal",
  },
  {
    id: "monochrome-minimal",
    name: "Monocromo Minimalista",
    tagline: "Essenziale, tipografico in bianco e nero puro",
    primaryColor: "#18181b",
    accentColor: "#52525b",
    bgLightColor: "#ffffff",
    surfaceLightColor: "#fafafa",
    textLightColor: "#09090b",
    bgDarkColor: "#09090b",
    surfaceDarkColor: "#18181b",
    textDarkColor: "#fafafa",
    headingFont: "Space Grotesk",
    bodyFont: "Inter",
    borderRadiusStyle: "sharp",
    cardStyle: "flat",
    navbarStyle: "minimal",
    heroLayout: "minimal",
  },
  {
    id: "rose-editorial",
    name: "Rosa Antico & Rubino",
    tagline: "Lifestyle, estetica raffinata e ritmo contemporaneo",
    primaryColor: "#be123c",
    accentColor: "#4c0519",
    bgLightColor: "#fffafb",
    surfaceLightColor: "#ffffff",
    textLightColor: "#1f1216",
    bgDarkColor: "#0f0508",
    surfaceDarkColor: "#1c0a10",
    textDarkColor: "#ffe4e6",
    headingFont: "DM Serif Display",
    bodyFont: "Work Sans",
    borderRadiusStyle: "rounded",
    cardStyle: "bordered",
    navbarStyle: "centered",
    heroLayout: "spotlight",
  },
];

export const HEADING_FONTS = [
  {
    id: "Georgia",
    label: "Georgia (Classico Editoriale Serif)",
    cssFamily: '"Georgia", "Cambria", "Times New Roman", Times, serif',
    googleFont: null,
  },
  {
    id: "Playfair Display",
    label: "Playfair Display (Magazine Alta Moda Serif)",
    cssFamily: '"Playfair Display", Georgia, serif',
    googleFont: "Playfair+Display:ital,wght@0,500;0,700;0,800;1,400",
  },
  {
    id: "Lora",
    label: "Lora (Letterario Caldo & Contemporaneo)",
    cssFamily: '"Lora", Georgia, serif',
    googleFont: "Lora:ital,wght@0,500;0,600;0,700;1,400",
  },
  {
    id: "Merriweather",
    label: "Merriweather (Saggistica & Alta Leggibilità)",
    cssFamily: '"Merriweather", Georgia, serif',
    googleFont: "Merriweather:ital,wght@0,400;0,700;0,900;1,400",
  },
  {
    id: "Cormorant Garamond",
    label: "Cormorant Garamond (Poetico & Raffinato)",
    cssFamily: '"Cormorant Garamond", Georgia, serif',
    googleFont: "Cormorant+Garamond:ital,wght@0,600;0,700;1,400",
  },
  {
    id: "DM Serif Display",
    label: "DM Serif Display (Titoli d'Impatto Editoriale)",
    cssFamily: '"DM Serif Display", Georgia, serif',
    googleFont: "DM+Serif+Display:ital@0;1",
  },
  {
    id: "Inter",
    label: "Inter (Sans-Serif Neutro & Moderno)",
    cssFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    googleFont: "Inter:wght@400;500;600;700;800",
  },
  {
    id: "Plus Jakarta Sans",
    label: "Plus Jakarta Sans (Geometrico Contemporaneo)",
    cssFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
    googleFont: "Plus+Jakarta+Sans:wght@500;600;700;800",
  },
  {
    id: "Space Grotesk",
    label: "Space Grotesk (Tech & Design Brutalist)",
    cssFamily: '"Space Grotesk", sans-serif',
    googleFont: "Space+Grotesk:wght@500;600;700",
  },
  {
    id: "Outfit",
    label: "Outfit (Pulito, Morbido & Minimal)",
    cssFamily: '"Outfit", sans-serif',
    googleFont: "Outfit:wght@500;600;700;800",
  },
];

export const BODY_FONTS = [
  {
    id: "Inter",
    label: "Inter (Standard UI & Lettura Nitida)",
    cssFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    googleFont: "Inter:wght@400;500;600;700",
  },
  {
    id: "Plus Jakarta Sans",
    label: "Plus Jakarta Sans (Moderno & Armonioso)",
    cssFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
    googleFont: "Plus+Jakarta+Sans:wght@400;500;600;700",
  },
  {
    id: "DM Sans",
    label: "DM Sans (Editoriale Pulito & Umanista)",
    cssFamily: '"DM Sans", -apple-system, sans-serif',
    googleFont: "DM+Sans:ital,wght@0,400;0,500;0,700;1,400",
  },
  {
    id: "Work Sans",
    label: "Work Sans (Equilibrato per Lunghi Articoli)",
    cssFamily: '"Work Sans", -apple-system, sans-serif',
    googleFont: "Work+Sans:wght@400;500;600;700",
  },
  {
    id: "Lora",
    label: "Lora (Corpo Testo in Serif stile Libro Stampato)",
    cssFamily: '"Lora", Georgia, serif',
    googleFont: "Lora:ital,wght@0,400;0,500;0,600;1,400",
  },
  {
    id: "Merriweather",
    label: "Merriweather (Serif Classico da Quotidiano)",
    cssFamily: '"Merriweather", Georgia, serif',
    googleFont: "Merriweather:ital,wght@0,300;0,400;0,700;1,400",
  },
  {
    id: "System",
    label: "System UI Nativo (Zero download, ultra-veloce)",
    cssFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    googleFont: null,
  },
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || "#c54c3d").replace("#", "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) || 197;
    const g = parseInt(clean[1] + clean[1], 16) || 76;
    const b = parseInt(clean[2] + clean[2], 16) || 61;
    return [r, g, b];
  }
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return [197, 76, 61];
  }
  return [r, g, b];
}

function mixRgb(
  rgb1: [number, number, number],
  rgb2: [number, number, number],
  weight: number
): string {
  const r = Math.round(rgb1[0] * (1 - weight) + rgb2[0] * weight);
  const g = Math.round(rgb1[1] * (1 - weight) + rgb2[1] * weight);
  const b = Math.round(rgb1[2] * (1 - weight) + rgb2[2] * weight);
  return `${r} ${g} ${b}`;
}

/**
 * Generates an 11-stop RGB palette (50..950) from a single primary hex color.
 * The base color is anchored at shade 600.
 */
export function generateBrandPaletteRgb(hex: string): Record<string, string> {
  const base = hexToRgb(hex);
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [10, 10, 15];

  return {
    "50": mixRgb(base, white, 0.93),
    "100": mixRgb(base, white, 0.85),
    "200": mixRgb(base, white, 0.72),
    "300": mixRgb(base, white, 0.54),
    "400": mixRgb(base, white, 0.32),
    "500": mixRgb(base, white, 0.14),
    "600": `${base[0]} ${base[1]} ${base[2]}`,
    "700": mixRgb(base, black, 0.18),
    "800": mixRgb(base, black, 0.35),
    "900": mixRgb(base, black, 0.52),
    "950": mixRgb(base, black, 0.72),
  };
}

export function getGoogleFontsUrl(headingFont?: string, bodyFont?: string): string | null {
  const families = new Set<string>();
  const h = HEADING_FONTS.find((f) => f.id === headingFont);
  const b = BODY_FONTS.find((f) => f.id === bodyFont);
  if (h?.googleFont) families.add(h.googleFont);
  if (b?.googleFont) families.add(b.googleFont);
  if (families.size === 0) return null;
  return `https://fonts.googleapis.com/css2?${Array.from(families)
    .map((f) => `family=${f}`)
    .join("&")}&display=swap`;
}

export function buildThemeCss(settings: Record<string, any> | null | undefined): string {
  const s = settings || {};
  const primaryPalette = generateBrandPaletteRgb(s.primaryColor || "#c54c3d");
  const accentPalette = generateBrandPaletteRgb(s.accentColor || "#1e293b");

  const headingObj =
    HEADING_FONTS.find((f) => f.id === s.headingFont) || HEADING_FONTS[0];
  const bodyObj =
    BODY_FONTS.find((f) => f.id === s.bodyFont) || BODY_FONTS[0];

  const baseFontSize = Number(s.baseFontSize) || 16;
  const lineHeightMap: Record<string, string> = {
    compact: "1.55",
    relaxed: "1.78",
    loose: "1.95",
  };
  const proseLineHeight = lineHeightMap[s.articleLineHeight || "relaxed"] || "1.78";

  const trackingMap: Record<string, string> = {
    tighter: "-0.04em",
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
  };
  const headingTracking = trackingMap[s.headingTracking || "tight"] || "-0.025em";

  const radiusMap: Record<string, { sm: string; md: string; lg: string; xl: string }> = {
    sharp: { sm: "0px", md: "0px", lg: "0px", xl: "0px" },
    subtle: { sm: "4px", md: "6px", lg: "8px", xl: "10px" },
    rounded: { sm: "8px", md: "12px", lg: "16px", xl: "24px" },
    pill: { sm: "14px", md: "20px", lg: "28px", xl: "36px" },
  };
  const rad = radiusMap[s.borderRadiusStyle || "rounded"] || radiusMap.rounded;

  const bgLight = s.bgLightColor || "#ffffff";
  const surfaceLight = s.surfaceLightColor || "#ffffff";
  const textLight = s.textLightColor || "#0f172a";
  const bgDark = s.bgDarkColor || "#020617";
  const surfaceDark = s.surfaceDarkColor || "#0f172a";
  const textDark = s.textDarkColor || "#f1f5f9";

  return `
:root {
  --brand-50: ${primaryPalette["50"]};
  --brand-100: ${primaryPalette["100"]};
  --brand-200: ${primaryPalette["200"]};
  --brand-300: ${primaryPalette["300"]};
  --brand-400: ${primaryPalette["400"]};
  --brand-500: ${primaryPalette["500"]};
  --brand-600: ${primaryPalette["600"]};
  --brand-700: ${primaryPalette["700"]};
  --brand-800: ${primaryPalette["800"]};
  --brand-900: ${primaryPalette["900"]};
  --brand-950: ${primaryPalette["950"]};
  --accent-500: ${accentPalette["500"]};
  --accent-600: ${accentPalette["600"]};
  --accent-700: ${accentPalette["700"]};
  --font-serif: ${headingObj.cssFamily};
  --font-sans: ${bodyObj.cssFamily};
  --cms-bg-light: ${bgLight};
  --cms-surface-light: ${surfaceLight};
  --cms-text-light: ${textLight};
  --cms-bg-dark: ${bgDark};
  --cms-surface-dark: ${surfaceDark};
  --cms-text-dark: ${textDark};
  --cms-radius-sm: ${rad.sm};
  --cms-radius-md: ${rad.md};
  --cms-radius-lg: ${rad.lg};
  --cms-radius-xl: ${rad.xl};
  --cms-base-font-size: ${baseFontSize}px;
  --cms-prose-line-height: ${proseLineHeight};
  --cms-heading-tracking: ${headingTracking};
}

html {
  font-size: var(--cms-base-font-size);
}

body.cms-public-body {
  background-color: var(--cms-bg-light);
  color: var(--cms-text-light);
}

html.dark body.cms-public-body {
  background-color: var(--cms-bg-dark);
  color: var(--cms-text-dark);
}

.cms-surface-card {
  background-color: var(--cms-surface-light);
  border-radius: var(--cms-radius-lg);
}

html.dark .cms-surface-card {
  background-color: var(--cms-surface-dark);
}

.cms-hero-card {
  background-color: var(--cms-surface-light);
  border-radius: var(--cms-radius-xl);
}

html.dark .cms-hero-card {
  background-color: var(--cms-surface-dark);
}

.font-serif, .prose h1, .prose h2, .prose h3 {
  letter-spacing: var(--cms-heading-tracking);
}

.prose p, .prose li {
  line-height: var(--cms-prose-line-height);
  font-size: calc(var(--cms-base-font-size) * 1.05);
}

${s.customCss || ""}
`.trim();
}

export function getContainerWidthClass(width?: string): string {
  switch (width) {
    case "compact":
      return "max-w-5xl";
    case "wide":
      return "max-w-7xl";
    default:
      return "max-w-6xl";
  }
}

export function getArticleWidthClass(width?: string): string {
  switch (width) {
    case "narrow":
      return "max-w-2xl";
    case "wide":
      return "max-w-5xl";
    default:
      return "max-w-4xl";
  }
}

export function getCardStyleClasses(style?: string): string {
  switch (style) {
    case "elevated":
      return "cms-surface-card border border-transparent shadow-lg hover:shadow-xl transition";
    case "flat":
      return "cms-surface-card border border-transparent shadow-none hover:bg-slate-50/80 dark:hover:bg-slate-900/80 transition";
    case "glass":
      return "cms-surface-card border border-slate-200/60 dark:border-slate-800/60 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md shadow-sm hover:shadow-md transition";
    default:
      return "cms-surface-card border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition";
  }
}

export function getImageAspectClass(ratio?: string): string {
  switch (ratio) {
    case "classic":
      return "aspect-[4/3]";
    case "square":
      return "aspect-square";
    case "portrait":
      return "aspect-[4/5]";
    default:
      return "aspect-video";
  }
}

export function getButtonRadiusClass(buttonStyle?: string): string {
  switch (buttonStyle) {
    case "sharp":
      return "rounded-none";
    case "rounded":
      return "rounded-xl";
    default:
      return "rounded-full";
  }
}

