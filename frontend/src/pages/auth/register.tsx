import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "../../components/layout/auth-layout";
import { Button } from "../../components/ui/button";
import { FormField } from "../../components/ui/form-field";
import { Input } from "../../components/ui/input";
import { PasswordInput } from "../../components/ui/password-input";
import { useToast } from "../../components/ui/toast";
import { useAuth } from "../../contexts/auth-context";
import { register as registerAccount } from "../../services/auth.service";

const schema = z.object({
  nomeCompleto: z.string().trim().min(3, "Informe seu nome completo."),
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(6, "Use no mínimo 6 caracteres."),
  confirmPassword: z.string().min(6, "Confirme sua senha."),
}).refine((values) => values.password === values.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof schema>;

export function RegisterPage() {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { nomeCompleto: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterForm) {
    setSubmitting(true);
    try {
      const result = await registerAccount({
        nomeCompleto: values.nomeCompleto,
        email: values.email,
        password: values.password,
      });

      if (result.requiresEmailConfirmation) {
        setConfirmationEmail(values.email);
        showToast("Conta criada. Confirme seu e-mail para entrar.");
        return;
      }

      await refreshSession();
      showToast("Conta criada com sucesso.");
      navigate("/onboarding", { replace: true });
    } catch (error) {
      console.error("Erro completo retornado durante o cadastro:", error);
      showToast(error instanceof Error ? error.message : String(error), "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationEmail) {
    return (
      <AuthLayout title="Confirme seu e-mail" description="Sua conta foi criada e está quase pronta.">
        <div className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-lg bg-success/[0.12] text-success"><MailCheck className="size-6" /></div>
          <p className="mt-5 text-sm font-semibold">Enviamos um link de confirmação</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Acesse <span className="font-medium text-foreground">{confirmationEmail}</span> e confirme o cadastro antes de entrar.</p>
          <Button className="mt-6 w-full" onClick={() => navigate("/login", { replace: true })}>Ir para o login</Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Criar conta" description="Comece a estruturar sua operação de hospedagem em uma plataforma SaaS profissional.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Nome completo" error={errors.nomeCompleto?.message}>
          <Input autoComplete="name" placeholder="Seu nome completo" autoFocus {...register("nomeCompleto")} />
        </FormField>
        <FormField label="E-mail" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="voce@empresa.com" {...register("email")} />
        </FormField>
        <FormField label="Senha" description="Use no mínimo 6 caracteres." error={errors.password?.message}>
          <PasswordInput autoComplete="new-password" placeholder="Crie uma senha" {...register("password")} />
        </FormField>
        <FormField label="Confirmar senha" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" placeholder="Digite a senha novamente" {...register("confirmPassword")} />
        </FormField>
        <Button type="submit" className="w-full" disabled={submitting}>
          <UserPlus className="size-4" />
          {submitting ? "Criando conta..." : "Criar conta"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta? <Link className="font-medium text-accent hover:underline" to="/login">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
