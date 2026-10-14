/* ------------------------------------------------------------------ */
/* Tipos de conteúdo do caderno                                        */
/* ------------------------------------------------------------------ */

export interface NoteKindDef {
  value: string;
  label: string;
  plural: string;
  icon: string;
  color: string;
  description: string;
}

export const NOTE_KINDS: NoteKindDef[] = [
  {
    value: "note",
    label: "Anotação",
    plural: "Anotações",
    icon: "NotebookPen",
    color: "#173D30",
    description: "Registro livre de estudos e aprendizados.",
  },
  {
    value: "fundamento",
    label: "Fundamento",
    plural: "Fundamentos",
    icon: "BookOpen",
    color: "#1F5443",
    description: "Conhecimentos e fundamentos estudados, sempre com a fonte indicada.",
  },
  {
    value: "erva",
    label: "Erva ou Planta",
    plural: "Ervas e Plantas",
    icon: "Leaf",
    color: "#3E6B4F",
    description: "Estudos sobre ervas conforme a fonte consultada.",
  },
  {
    value: "banho",
    label: "Banho",
    plural: "Banhos",
    icon: "Droplets",
    color: "#3A6B7A",
    description: "Preparos de banhos aprendidos, com orientação da sua fonte.",
  },
  {
    value: "defumacao",
    label: "Defumação",
    plural: "Defumações",
    icon: "Flame",
    color: "#8A5A2B",
    description: "Registros de defumação com cuidados de segurança.",
  },
  {
    value: "prato",
    label: "Prato ou Oferenda",
    plural: "Pratos e Oferendas",
    icon: "Soup",
    color: "#7A5636",
    description: "Pratos, receitas e materiais da sua tradição.",
  },
  {
    value: "entidade",
    label: "Entidade ou Linha",
    plural: "Entidades e Linhas",
    icon: "Sparkles",
    color: "#6B5A8A",
    description: "Estudos sobre entidades, linhas de trabalho e Orixás.",
  },
];

export const NOTE_KIND_MAP: Record<string, NoteKindDef> = Object.fromEntries(
  NOTE_KINDS.map((k) => [k.value, k]),
);

export const ORIGIN_OPTIONS = [
  { value: "pessoal", label: "Anotação pessoal" },
  { value: "referencia", label: "Referência (livro, site, material)" },
  { value: "ensinamento", label: "Ensinamento recebido" },
] as const;

export const ENTITY_TYPES = [
  { value: "", label: "Não informado" },
  { value: "entidade", label: "Entidade" },
  { value: "linha", label: "Linha de trabalho" },
  { value: "orixa", label: "Orixá" },
  { value: "outro", label: "Outro" },
];

/* ------------------------------------------------------------------ */
/* Categorias padrão criadas para novos usuários                       */
/* ------------------------------------------------------------------ */

export const DEFAULT_CATEGORIES = [
  { name: "Fundamentos", icon: "BookOpen", color: "#173D30", description: "" },
  { name: "Ervas e Plantas", icon: "Leaf", color: "#3E6B4F", description: "" },
  { name: "Banhos", icon: "Droplets", color: "#3A6B7A", description: "" },
  { name: "Defumações", icon: "Flame", color: "#8A5A2B", description: "" },
  { name: "Pratos e Oferendas", icon: "Soup", color: "#7A5636", description: "" },
  { name: "Entidades e Linhas", icon: "Sparkles", color: "#6B5A8A", description: "" },
  { name: "Orixás e Estudos", icon: "Sun", color: "#B07A1F", description: "" },
  { name: "Pontos e Cantigas", icon: "Music", color: "#4F6B8A", description: "" },
  { name: "Guias e Materiais de Estudo", icon: "BookMarked", color: "#265041", description: "" },
  { name: "Rituais e Práticas Aprendidas", icon: "Scroll", color: "#5E6B3F", description: "" },
  { name: "Diário Espiritual", icon: "Feather", color: "#7A7A56", description: "" },
  { name: "Anotações Gerais", icon: "StickyNote", color: "#5A6B62", description: "" },
];

/* ------------------------------------------------------------------ */
/* Diário                                                              */
/* ------------------------------------------------------------------ */

export const MOODS = [
  { value: "", label: "Sem registro" },
  { value: "gratidao", label: "Gratidão" },
  { value: "paz", label: "Paz" },
  { value: "reflexao", label: "Reflexão" },
  { value: "aprendizado", label: "Aprendizado" },
  { value: "inquietacao", label: "Inquietação" },
  { value: "esperanca", label: "Esperança" },
  { value: "recolhimento", label: "Recolhimento" },
];

export const MOOD_LABELS: Record<string, string> = Object.fromEntries(
  MOODS.map((m) => [m.value, m.label]),
);

/* ------------------------------------------------------------------ */
/* Arquivos                                                            */
/* ------------------------------------------------------------------ */

export const FILE_RULES: Array<{ mime: string[]; ext: string[]; max: number; label: string }> = [
  { mime: ["application/pdf"], ext: [".pdf"], max: 15 * 1024 * 1024, label: "PDF (até 15 MB)" },
  {
    mime: ["image/jpeg", "image/png", "image/webp"],
    ext: [".jpg", ".jpeg", ".png", ".webp"],
    max: 6 * 1024 * 1024,
    label: "Imagem JPG/PNG/WebP (até 6 MB)",
  },
  {
    mime: ["text/plain", "text/markdown"],
    ext: [".txt", ".md"],
    max: 2 * 1024 * 1024,
    label: "Texto (até 2 MB)",
  },
];

export const ACCEPTED_FILE_TYPES = FILE_RULES.flatMap((r) => r.mime).join(",");

export const TRASH_RETENTION_DAYS = 30;

/* ------------------------------------------------------------------ */
/* Identidade                                                          */
/* ------------------------------------------------------------------ */

export const APP_NAME = "Meu Axé";
export const APP_TAGLINE = "Meu espaço. Meus estudos. Minha caminhada.";
export const APP_QUOTE = "Todo conhecimento merece ser registrado.";
