import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
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
import { getAuthErrorMessage } from "../../lib/auth-error";
import { isSupabaseConfigured } from "../../lib/supabase";
import { login } from "../../services/auth.service";

const schema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(6, "Informe sua senha."),
});

type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginForm) {
    setSubmitting(true);
    try {
      await login(values);
      await refreshSession();
      showToast("Login realizado com sucesso.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      showToast(getAuthErrorMessage(error, "Não foi possível entrar. Verifique seus dados e tente novamente."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Entrar no Essencial Stay" description="Acesse sua plataforma de gestão de hospedagens inteligentes.">
      {!isSupabaseConfigured && (
        <div role="alert" className="mb-4 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-foreground">
          O acesso à plataforma não está configurado neste ambiente. Contate o suporte.
        </div>
      )}
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="E-mail" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="voce@empresa.com" autoFocus {...register("email")} />
        </FormField>
        <FormField label="Senha" error={errors.password?.message}>
          <PasswordInput autoComplete="current-password" placeholder="Sua senha" {...register("password")} />
        </FormField>
        <div className="flex justify-end">
          <Link className="text-sm font-medium text-accent hover:underline" to="/forgot-password">Esqueci minha senha</Link>
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          <LogIn className="size-4" />
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta? <Link className="font-medium text-accent hover:underline" to="/register">Criar conta</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
