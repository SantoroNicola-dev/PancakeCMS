"use client";

import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Youtube from "@tiptap/extension-youtube";
import CharacterCount from "@tiptap/extension-character-count";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Code2,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  PlusCircle,
  Quote,
  Redo2,
  Sparkles,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
  Youtube as YoutubeIcon,
} from "lucide-react";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { calculateReadingTime, countWords } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Inizia a scrivere il tuo articolo... (Premi '+' o usa la barra in alto per inserire immagini, citazioni, tabelle o video)",
}: RichTextEditorProps) {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [sourceMode, setSourceMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-brand-600 underline font-medium",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-xl my-6 max-w-full h-auto shadow-md mx-auto",
        },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({
        width: 720,
        height: 405,
        HTMLAttributes: {
          class: "rounded-xl overflow-hidden my-6 aspect-video w-full",
        },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-slate dark:prose-invert max-w-none min-h-[440px] px-6 py-5 focus:outline-none text-slate-800 dark:text-slate-100 leading-relaxed",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      setRawHtml(html);
      onChange(html);
    },
  });

  // Sync external changes (es. ripristino revisione)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
      setRawHtml(value);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-[440px] animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900" />
    );
  }

  const addLink = () => {
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("Inserisci l'URL del link:", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addYoutube = () => {
    const url = window.prompt(
      "Inserisci l'URL del video YouTube:",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  const insertCalloutBox = () => {
    editor
      .chain()
      .focus()
      .insertContent(
        `<blockquote><p><strong>💡 Nota Editoriale:</strong> Scrivi qui un approfondimento o un consiglio chiave per il lettore.</p></blockquote>`
      )
      .run();
  };

  const words = countWords(rawHtml);
  const readingTime = calculateReadingTime(rawHtml);

  const btnClass = (active = false) =>
    `p-2 rounded-lg text-xs transition ${
      active
        ? "bg-brand-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/95 px-3 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className={btnClass(false)}
          title="Annulla (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className={btnClass(false)}
          title="Ripeti (Ctrl+Y)"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-800" />

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={btnClass(editor.isActive("heading", { level: 1 }))}
          title="Titolo H1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={btnClass(editor.isActive("heading", { level: 2 }))}
          title="Sottotitolo H2 (Genera Indice TOC)"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={btnClass(editor.isActive("heading", { level: 3 }))}
          title="Sottotitolo H3 (Genera Indice TOC)"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-800" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive("bold"))}
          title="Grassetto"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive("italic"))}
          title="Corsivo"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive("underline"))}
          title="Sottolineato"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(editor.isActive("strike"))}
          title="Barrato"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={btnClass(editor.isActive("highlight"))}
          title="Evidenziatore"
        >
          <Highlighter className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-800" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={btnClass(editor.isActive({ textAlign: "left" }))}
          title="Allinea a sinistra"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={btnClass(editor.isActive({ textAlign: "center" }))}
          title="Centra"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={btnClass(editor.isActive({ textAlign: "right" }))}
          title="Allinea a destra"
        >
          <AlignRight className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-800" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive("bulletList"))}
          title="Elenco puntato"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive("orderedList"))}
          title="Elenco numerato"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive("blockquote"))}
          title="Citazione"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={insertCalloutBox}
          className={btnClass(false)}
          title="Inserisci Callout Box Editoriale"
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={btnClass(editor.isActive("codeBlock"))}
          title="Blocco Codice"
        >
          <Code className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-800" />

        <button
          type="button"
          onClick={addLink}
          className={btnClass(editor.isActive("link"))}
          title="Inserisci/Modifica Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowMediaPicker(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:bg-brand-950/50 dark:text-brand-300"
          title="Inserisci Immagine dalla Libreria Media"
        >
          <ImageIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Media</span>
        </button>
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className={btnClass(editor.isActive("table"))}
          title="Inserisci Tabella 3×3"
        >
          <TableIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={addYoutube}
          className={btnClass(false)}
          title="Incorpora Video YouTube"
        >
          <YoutubeIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={btnClass(false)}
          title="Divisore orizzontale"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSlashMenu((s) => !s)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <PlusCircle className="h-3.5 w-3.5 text-brand-600" /> Blocchi `/`
          </button>
          <button
            type="button"
            onClick={() => setSourceMode((s) => !s)}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${
              sourceMode
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
            }`}
            title="Ispeziona o modifica sorgente HTML"
          >
            <Code2 className="h-3.5 w-3.5" /> HTML
          </button>
        </div>
      </div>

      {/* Quick Slash-Block Palette */}
      {showSlashMenu && (
        <div className="grid grid-cols-2 gap-2 border-b border-slate-200 bg-slate-100/80 p-3 text-xs sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
              setShowSlashMenu(false);
            }}
            className="flex items-center gap-2 rounded-lg bg-white p-2 text-left font-medium shadow-sm hover:border-brand-500 dark:bg-slate-800"
          >
            <Heading2 className="h-4 w-4 text-brand-600" /> Sezione H2 (TOC)
          </button>
          <button
            type="button"
            onClick={() => {
              setShowMediaPicker(true);
              setShowSlashMenu(false);
            }}
            className="flex items-center gap-2 rounded-lg bg-white p-2 text-left font-medium shadow-sm hover:border-brand-500 dark:bg-slate-800"
          >
            <ImageIcon className="h-4 w-4 text-emerald-600" /> Immagine + Didascalia
          </button>
          <button
            type="button"
            onClick={() => {
              insertCalloutBox();
              setShowSlashMenu(false);
            }}
            className="flex items-center gap-2 rounded-lg bg-white p-2 text-left font-medium shadow-sm hover:border-brand-500 dark:bg-slate-800"
          >
            <Sparkles className="h-4 w-4 text-amber-500" /> Box Callout
          </button>
          <button
            type="button"
            onClick={() => {
              addYoutube();
              setShowSlashMenu(false);
            }}
            className="flex items-center gap-2 rounded-lg bg-white p-2 text-left font-medium shadow-sm hover:border-brand-500 dark:bg-slate-800"
          >
            <YoutubeIcon className="h-4 w-4 text-rose-600" /> Embed YouTube
          </button>
        </div>
      )}

      {/* Editor Surface */}
      {sourceMode ? (
        <div className="p-4">
          <textarea
            value={rawHtml}
            onChange={(e) => {
              setRawHtml(e.target.value);
              onChange(e.target.value);
              editor.commands.setContent(e.target.value, false);
            }}
            rows={18}
            className="w-full rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs text-emerald-300 focus:outline-none dark:border-slate-800"
          />
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}

      {/* Footer Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <FileText className="h-3.5 w-3.5 text-brand-600" />
            {words} parole
          </span>
          <span>•</span>
          <span>Tempo di lettura stimato: ~{readingTime} min</span>
        </div>
        <div className="text-[11px] text-slate-400">
          I sottotitoli <strong>H2</strong> e <strong>H3</strong> generano automaticamente l&apos;Indice dei Contenuti (TOC) nell&apos;articolo.
        </div>
      </div>

      {showMediaPicker && (
        <MediaPickerModal
          onClose={() => setShowMediaPicker(false)}
          onSelect={(mediaItem) => {
            const captionHtml = mediaItem.caption
              ? `<p><em>${mediaItem.caption}</em></p>`
              : "";
            editor
              .chain()
              .focus()
              .insertContent(
                `<img src="${mediaItem.url}" alt="${
                  mediaItem.altText || mediaItem.title
                }" title="${mediaItem.title || ""}" />${captionHtml}`
              )
              .run();
            setShowMediaPicker(false);
          }}
        />
      )}
    </div>
  );
}

