import {
  Archive,
  BookMarked,
  BookOpen,
  Droplets,
  Feather,
  FileText,
  Flame,
  Folder,
  FolderOpen,
  Leaf,
  Music,
  NotebookPen,
  Scroll,
  Soup,
  Sparkles,
  Star,
  StickyNote,
  Sun,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Folder,
  FolderOpen,
  BookOpen,
  BookMarked,
  NotebookPen,
  Leaf,
  Droplets,
  Flame,
  Soup,
  Sparkles,
  Sun,
  Music,
  Scroll,
  Feather,
  StickyNote,
  Star,
  FileText,
  Archive,
};

export function NamedIcon({
  name,
  className,
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Cmp = MAP[name] ?? Folder;
  return <Cmp className={className} size={size} aria-hidden="true" />;
}

export const ICON_OPTIONS = Object.keys(MAP);
