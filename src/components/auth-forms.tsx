"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button, Field, Input } from "./ui";
import {
  signIn,
  signUp,
  requestPasswordReset,
  resetPassword,
  type AuthState,
} from "@/app/actions/auth";

const initial: AuthState = {};

function ErrorAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-3.5 py-3 text-sm text-danger dark:bg-[#40201a]"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function PasswordInput({
  id,
  name,
  autoComplete,
  error,
  placeholder,
}: {
  id: string;
  name: string;
  autoComplete: string;
  error?: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={!!error}
        className="pr-11"
        required
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-3 hover:text-ink cursor-pointer"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/* --------------------------------- login -------------------------------- */

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        Entrar na minha conta
      </h1>
      <p className="mt-2 text-sm text-ink-2">
        Acesse seu caderno de estudos, o diário e a sua biblioteca.
      </p>

      {notice === "redefinida" && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-success/25 bg-success-soft px-3.5 py-3 text-sm text-success dark:bg-[#173527]">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>Senha redefinida com sucesso. Entre com a sua nova senha.</p>
        </div>
      )}

      <form action={action} className="mt-7 space-y-4" noValidate={false}>
        <input type="hidden" name="next" value={next} />
        <ErrorAlert message={state.error} />
        <Field label="E-mail" htmlFor="email" error={state.fieldErrors?.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            required
          />
        </Field>
        <Field label="Senha" htmlFor="password" error={state.fieldErrors?.password}>
          <PasswordInput id="password" name="password" autoComplete="current-password" error={state.fieldErrors?.password} />
        </Field>
        <div className="flex justify-end">
          <Link href="/recuperar" className="text-sm font-medium text-forest hover:underline dark:text-sage">
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" size="lg" loading={pending} className="w-full">
          Entrar <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-2">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-forest hover:underline dark:text-sage">
          Criar minha conta
        </Link>
      </p>
    </div>
  );
}

/* -------------------------------- cadastro ------------------------------- */

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initial);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        Começar meus estudos
      </h1>
      <p className="mt-2 text-sm text-ink-2">
        Crie sua conta para montar o seu espaço pessoal de conhecimento.
      </p>

      <form action={action} className="mt-7 space-y-4">
        <ErrorAlert message={state.error} />
        <Field label="Seu nome" htmlFor="name" error={state.fieldErrors?.name}>
          <Input id="name" name="name" autoComplete="name" placeholder="Como podemos te chamar?" required />
        </Field>
        <Field label="E-mail" htmlFor="email" error={state.fieldErrors?.email}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required />
        </Field>
        <Field
          label="Senha"
          htmlFor="password"
          hint="Mínimo de 8 caracteres."
          error={state.fieldErrors?.password}
        >
          <PasswordInput id="password" name="password" autoComplete="new-password" error={state.fieldErrors?.password} />
        </Field>
        <Button type="submit" size="lg" loading={pending} className="w-full">
          Criar minha conta <ArrowRight className="size-4" />
        </Button>
        <p className="text-xs leading-relaxed text-ink-3">
          Ao criar a conta, você concorda em guardar seus dados de acesso com cuidado. Suas
          anotações são privadas e pertencem somente a você.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-ink-2">
        Já tem uma conta?{" "}
        <Link href="/login" className="font-medium text-forest hover:underline dark:text-sage">
          Entrar
        </Link>
      </p>
    </div>
  );
}

/* ------------------------------- recuperar ------------------------------- */

export function RecoverForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        Recuperar senha
      </h1>
      <p className="mt-2 text-sm text-ink-2">
        Informe o e-mail da sua conta para gerar um link de redefinição.
      </p>

      {state.message ? (
        <div className="mt-7 space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-success/25 bg-success-soft px-3.5 py-3 text-sm text-success dark:bg-[#173527]">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <p>{state.message}</p>
          </div>
          {state.resetUrl && (
            <div className="rounded-xl border border-gold/40 bg-gold-soft/60 p-4 dark:bg-[#2c2818]">
              <p className="text-xs font-medium uppercase tracking-wide text-gold-deep dark:text-gold">
                Link de redefinição (válido por 1 hora)
              </p>
              <Link
                href={state.resetUrl}
                className="mt-1.5 block break-all text-sm font-medium text-forest underline underline-offset-2 dark:text-sage"
              >
                Abrir página de redefinição de senha
              </Link>
            </div>
          )}
          <Link href="/login" className="block text-center text-sm font-medium text-forest hover:underline dark:text-sage">
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form action={action} className="mt-7 space-y-4">
          <Field label="E-mail da conta" htmlFor="email" error={state.fieldErrors?.email}>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required />
          </Field>
          <Button type="submit" size="lg" loading={pending} className="w-full">
            Gerar link de recuperação
          </Button>
          <p className="text-center text-sm text-ink-2">
            Lembrou a senha?{" "}
            <Link href="/login" className="font-medium text-forest hover:underline dark:text-sage">
              Entrar
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

/* ------------------------------- redefinir ------------------------------- */

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, initial);

  if (!token) {
    return (
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Link inválido
        </h1>
        <p className="mt-2 text-sm text-ink-2">
          Este link de recuperação está incompleto ou expirou. Solicite um novo link.
        </p>
        <Link href="/recuperar" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-forest px-6 py-3 text-sm font-medium text-on-forest hover:bg-forest-bright">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        Definir nova senha
      </h1>
      <p className="mt-2 text-sm text-ink-2">Escolha uma nova senha segura para a sua conta.</p>

      <form action={action} className="mt-7 space-y-4">
        <input type="hidden" name="token" value={token} />
        <ErrorAlert message={state.error} />
        <Field label="Nova senha" htmlFor="password" hint="Mínimo de 8 caracteres." error={state.fieldErrors?.password}>
          <PasswordInput id="password" name="password" autoComplete="new-password" error={state.fieldErrors?.password} />
        </Field>
        <Field label="Confirmar nova senha" htmlFor="confirm" error={state.fieldErrors?.confirm}>
          <PasswordInput id="confirm" name="confirm" autoComplete="new-password" error={state.fieldErrors?.confirm} />
        </Field>
        <Button type="submit" size="lg" loading={pending} className="w-full">
          Salvar nova senha
        </Button>
      </form>
    </div>
  );
}
