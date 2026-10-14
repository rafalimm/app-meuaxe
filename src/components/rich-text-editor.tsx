"use client";

import { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import ImageExtension from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Link2,
  Link2Off,
  Image as ImageIcon,
  Minus,
  Undo2,
  Redo2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "./toast";

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40 cursor-pointer",
        active && "bg-sage-soft text-forest dark:bg-surface-3 dark:text-gold",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onInsertImageFile }: { editor: Editor; onInsertImageFile: (f: File) => void }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="sticky top-0 z-10 -mx-1 border-b border-line bg-surface/95 px-1 py-1.5 backdrop-blur-sm rounded-t-xl">
      <div className="flex flex-wrap items-center gap-0.5">
        <ToolbarButton label="Desfazer" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Refazer" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        <ToolbarButton label="Negrito" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Itálico" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        <ToolbarButton label="Título" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Subtítulo" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        <ToolbarButton label="Lista com marcadores" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <ListChecks className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Citação" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Linha divisória" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        {editor.isActive("link") ? (
          <ToolbarButton label="Remover link" active onClick={() => editor.chain().focus().unsetLink().run()}>
            <Link2Off className="size-4" />
          </ToolbarButton>
        ) : (
          <ToolbarButton
            label="Inserir link"
            active={linkOpen}
            onClick={() => {
              setLinkUrl((editor.getAttributes("link").href as string) ?? "");
              setLinkOpen((v) => !v);
            }}
          >
            <Link2 className="size-4" />
          </ToolbarButton>
        )}
        <ToolbarButton label="Inserir imagem" onClick={() => fileRef.current?.click()}>
          <ImageIcon className="size-4" />
        </ToolbarButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onInsertImageFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {linkOpen && (
        <form
          className="mt-1.5 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const url = linkUrl.trim();
            if (url) {
              const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
              editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
            }
            setLinkOpen(false);
          }}
        >
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://exemplo.com"
            className="h-8 flex-1 rounded-lg border border-line bg-surface px-2.5 text-sm outline-none focus:border-gold"
            aria-label="Endereço do link"
            autoFocus
          />
          <button type="submit" className="h-8 rounded-lg bg-forest px-3 text-sm text-on-forest cursor-pointer">
            Aplicar
          </button>
        </form>
      )}
    </div>
  );
}

export function RichTextEditor({
  initialContent = "",
  onChange,
  placeholder = "Comece a escrever...",
  minHeight = 220,
  compact = false,
  onUploadStateChange,
}: {
  initialContent?: string;
  onChange?: (html: string, text: string) => void;
  placeholder?: string;
  minHeight?: number;
  compact?: boolean;
  onUploadStateChange?: (uploading: boolean) => void;
}) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      ImageExtension.configure({ inline: false }),
    ],
    content: initialContent || undefined,
    editorProps: {
      attributes: {
        class: "tiptap px-1 py-3",
        style: `min-height: ${minHeight}px`,
        "aria-label": "Editor de conteúdo",
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML(), e.getText());
    },
  });

  const insertImageFile = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      onUploadStateChange?.(true);
      try {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("purpose", "inline");
        const res = await fetch("/api/files/upload", { method: "POST", body: fd });
        const data = (await res.json()) as { ok?: boolean; id?: string; error?: string };
        if (!res.ok || !data.ok || !data.id) {
          toast.error(data.error || "Não foi possível enviar a imagem.");
          return;
        }
        editor.chain().focus().setImage({ src: `/api/files/${data.id}`, alt: file.name }).run();
      } catch {
        toast.error("Falha de conexão ao enviar a imagem. Tente novamente.");
      } finally {
        setUploading(false);
        onUploadStateChange?.(false);
      }
    },
    [editor, toast, onUploadStateChange],
  );

  if (!editor) {
    return (
      <div className="flex items-center gap-2 px-2 py-6 text-sm text-ink-3">
        <Loader2 className="size-4 animate-spin" /> Preparando o editor…
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl", compact && "text-sm")}>
      {uploading && (
        <div className="mb-1.5 inline-flex items-center gap-2 rounded-full bg-gold-soft px-3 py-1 text-xs text-gold-deep dark:bg-[#3a3320] dark:text-gold">
          <Loader2 className="size-3 animate-spin" /> Enviando imagem…
        </div>
      )}
      <Toolbar editor={editor} onInsertImageFile={insertImageFile} />
      <EditorContent editor={editor} />
    </div>
  );
}
