import { z } from "zod";

export const emailField = z
  .string()
  .trim()
  .min(1, "Informe seu e-mail.")
  .email("Informe um e-mail válido.")
  .max(200);

export const passwordField = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(100, "A senha é muito longa.");

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(80, "Nome muito longo."),
    email: emailField,
    password: passwordField,
  })
  .strict();

export const signInSchema = z
  .object({
    email: emailField,
    password: z.string().min(1, "Informe sua senha."),
  })
  .strict();

export const requestResetSchema = z.object({ email: emailField }).strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: passwordField,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "As senhas não coincidem.",
    path: ["confirm"],
  });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(80, "Nome muito longo."),
});

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Informe sua senha atual."),
    password: passwordField,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "As senhas não coincidem.",
    path: ["confirm"],
  });

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Informe um nome.").max(60, "Nome muito longo."),
  description: z.string().trim().max(500).optional().default(""),
  icon: z.string().trim().max(40).optional().default("Folder"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida.")
    .optional()
    .default("#173D30"),
  sortOrder: z.number().int().optional().default(0),
});

export const notePatchSchema = z.object({
  title: z.string().max(300).optional(),
  summary: z.string().max(2000).optional(),
  content: z.string().max(400_000).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  subcategory: z.string().max(120).optional(),
  source: z.string().max(200).optional(),
  origin: z.enum(["pessoal", "referencia", "ensinamento"]).optional(),
  kind: z
    .enum(["note", "fundamento", "erva", "banho", "defumacao", "prato", "entidade"])
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  coverAttachmentId: z.string().uuid().nullable().optional(),
});

export const quickNoteSchema = z.object({
  kind: z
    .enum(["note", "fundamento", "erva", "banho", "defumacao", "prato", "entidade"])
    .default("note"),
  title: z.string().max(300).optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

export const diaryPatchSchema = z.object({
  title: z.string().max(300).optional(),
  content: z.string().max(400_000).optional(),
  mood: z.string().max(40).optional(),
  entryDate: z.string().optional(),
});

export const searchSchema = z.object({
  q: z.string().trim().max(200).default(""),
  kind: z.string().trim().max(30).default(""),
  categoryId: z.string().trim().max(40).default(""),
  favorite: z.boolean().default(false),
  from: z.string().trim().max(20).default(""),
  to: z.string().trim().max(20).default(""),
  tag: z.string().trim().max(60).default(""),
  sort: z.enum(["recent", "oldest", "updated", "alpha"]).default("updated"),
  includeDiary: z.boolean().default(true),
  includeFiles: z.boolean().default(true),
});

export type SearchParams = z.infer<typeof searchSchema>;
