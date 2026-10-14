"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Camera, CheckCircle2, Moon, Sun, Trash2 } from "lucide-react";
import { cn, initialsOf } from "@/lib/utils";
import {
  changePassword,
  deleteAccount,
  setAvatar,
  updateProfile,
  type AuthState,
} from "@/app/actions/auth";
import { setA11y, setDashboardGoal, setTheme } from "@/app/actions/preferences";
import { Button, Field, Input } from "./ui";
import { Modal } from "./dialog";
import { useToast } from "./toast";
import { FileUploadButton } from "./file-upload";

const initial: AuthState = {};

/* -------------------------------- perfil -------------------------------- */

export function ProfileForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (state.message) {
      toast.success(state.message);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Field label="Seu nome" htmlFor="pf-name" error={state.fieldErrors?.name} className="flex-1">
        <Input id="pf-name" name="name" defaultValue={name} maxLength={80} required />
      </Field>
      <Button type="submit" loading={pending}>
        Salvar
      </Button>
    </form>
  );
}

/* -------------------------------- avatar -------------------------------- */

export function AvatarUploader({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-4">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`Foto de ${name}`}
          className="size-16 rounded-2xl object-cover ring-1 ring-line"
        />
      ) : (
        <span className="flex size-16 items-center justify-center rounded-2xl bg-forest font-display text-xl text-on-forest">
          {initialsOf(name)}
        </span>
      )}
      <div className="flex flex-col gap-2">
        <FileUploadButton
          purpose="avatar"
          accept="image/jpeg,image/png,image/webp"
          label="Escolher foto"
          onUploaded={(f) => {
            startTransition(async () => {
              const res = await setAvatar(f.id);
              if (res.error) toast.error(res.error);
              else {
                toast.success("Foto de perfil atualizada.");
                router.refresh();
              }
            });
          }}
          className="text-xs"
        />
        {avatarUrl && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await setAvatar(null);
                toast.success("Foto removida.");
                router.refresh();
              })
            }
            className="self-start text-xs font-medium text-danger hover:underline cursor-pointer disabled:opacity-60"
          >
            Remover foto
          </button>
        )}
        <p className="text-xs text-ink-3">
          <Camera className="mr-1 inline size-3" /> JPG, PNG ou WebP até 6 MB.
        </p>
      </div>
    </div>
  );
}

/* --------------------------------- tema --------------------------------- */

export function ThemeToggle({ current }: { current: "light" | "dark" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(current);

  function choose(theme: "light" | "dark") {
    setValue(theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    startTransition(async () => {
      await setTheme(theme);
      router.refresh();
    });
  }

  return (
    <div className="inline-flex rounded-xl border border-line bg-surface p-1 shadow-card" role="group" aria-label="Tema">
      <button
        type="button"
        onClick={() => choose("light")}
        aria-pressed={value === "light"}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition cursor-pointer",
          value === "light" ? "bg-forest text-on-forest" : "text-ink-2 hover:text-ink",
        )}
      >
        <Sun className="size-4" /> Claro
      </button>
      <button
        type="button"
        onClick={() => choose("dark")}
        aria-pressed={value === "dark"}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition cursor-pointer",
          value === "dark" ? "bg-forest text-on-forest" : "text-ink-2 hover:text-ink",
        )}
      >
        <Moon className="size-4" /> Escuro
      </button>
    </div>
  );
}

/* ---------------------------- acessibilidade ----------------------------- */

function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl px-1 py-2 text-left cursor-pointer"
    >
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="mt-0.5 block text-xs text-ink-2">{description}</span>
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-forest" : "bg-line-2",
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function A11yToggles({
  reducedMotion,
  largeText,
}: {
  reducedMotion: boolean;
  largeText: boolean;
}) {
  const [rm, setRm] = useState(reducedMotion);
  const [lt, setLt] = useState(largeText);

  function persist(nextRm: boolean, nextLt: boolean) {
    localStorage.setItem("mx-a11y", JSON.stringify({ rm: nextRm, lt: nextLt }));
    document.documentElement.classList.toggle("reduce-motion", nextRm);
    document.documentElement.classList.toggle("large-text", nextLt);
    void setA11y({ reducedMotion: nextRm, largeText: nextLt });
  }

  return (
    <div className="divide-y divide-line">
      <Switch
        checked={rm}
        onChange={(v) => {
          setRm(v);
          persist(v, lt);
        }}
        label="Reduzir movimento"
        description="Diminui animações e transições em todo o aplicativo."
      />
      <Switch
        checked={lt}
        onChange={(v) => {
          setLt(v);
          persist(rm, v);
        }}
        label="Texto maior"
        description="Aumenta levemente o tamanho base do texto para facilitar a leitura."
      />
    </div>
  );
}

/* ----------------------------- objetivo do início ----------------------------- */

export function GoalForm({ initial: initialGoal }: { initial: string }) {
  const [value, setValue] = useState(initialGoal);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await setDashboardGoal(value);
          if (res.error) toast.error(res.error);
          else toast.success(res.message ?? "Objetivo atualizado.");
        });
      }}
    >
      <Field
        label="Objetivo de estudos exibido no início"
        htmlFor="goal"
        hint="Ex.: “Terminar de organizar os fundamentos até o fim do mês”."
        className="flex-1"
      >
        <Input id="goal" value={value} onChange={(e) => setValue(e.target.value)} maxLength={200} />
      </Field>
      <Button type="submit" loading={pending}>
        Salvar
      </Button>
    </form>
  );
}

/* -------------------------------- senha --------------------------------- */

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (state.message) {
      toast.success(state.message);
      formRef.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-3">
      <Field label="Senha atual" htmlFor="pw-current" error={state.fieldErrors?.current}>
        <Input id="pw-current" name="current" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="Nova senha" htmlFor="pw-new" hint="Mínimo de 8 caracteres." error={state.fieldErrors?.password}>
        <Input id="pw-new" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Confirmar nova senha" htmlFor="pw-confirm" error={state.fieldErrors?.confirm}>
        <Input id="pw-confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <div className="sm:col-span-3">
        <Button type="submit" loading={pending}>
          Alterar senha
        </Button>
      </div>
    </form>
  );
}

/* ---------------------------- excluir conta ------------------------------ */

export function DeleteAccountZone({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAccount, initial);

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-danger/30 bg-danger-soft/50 p-4 dark:bg-[#2a1512] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-danger">
            <AlertTriangle className="size-4" /> Excluir conta
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">
            Apaga definitivamente sua conta, todas as anotações, o diário e os arquivos. Esta ação é
            irreversível.
          </p>
        </div>
        <Button variant="danger" onClick={() => setOpen(true)}>
          <Trash2 className="size-4" /> Excluir minha conta
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Excluir conta permanentemente">
        <p className="text-sm leading-relaxed text-ink-2">
          Para confirmar, digite o seu e-mail <strong className="text-ink">{email}</strong>. Todos
          os seus dados serão excluídos e não poderão ser recuperados. Se preferir, exporte seus
          dados antes.
        </p>
        <form action={action} className="mt-4 space-y-4">
          <Field label="Seu e-mail" htmlFor="da-email" error={state.fieldErrors?.email}>
            <Input id="da-email" name="email" type="email" autoComplete="off" placeholder={email} required />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger" loading={pending}>
              Excluir tudo permanentemente
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function OkNote({ message }: { message: string }) {
  return (
    <p className="inline-flex items-center gap-2 text-sm text-success">
      <CheckCircle2 className="size-4" /> {message}
    </p>
  );
}
