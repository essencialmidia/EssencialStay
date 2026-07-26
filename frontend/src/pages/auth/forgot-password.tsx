import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "../../components/layout/auth-layout";
import { Button } from "../../components/ui/button";
import { FormField } from "../../components/ui/form-field";
import { Input } from "../../components/ui/input";
import { getAuthErrorMessage } from "../../lib/auth-error";
import { forgotPassword } from "../../services/auth.service";
import { useToast } from "../../components/ui/toast";

const schema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
});

type ForgotPasswordForm = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({ resolver: zodResolver(schema) });

  async function onSubmit(values: ForgotPasswordForm) {
    setSubmitting(true);
    try {
      await forgotPassword(values.email);
      showToast("Enviamos as instruções de recuperação para o e-mail informado.");
    } catch (error) {
      showToast(getAuthErrorMessage(error, "Não foi possível enviar as instruções de recuperação."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Recuperar senha" description="Informe seu e-mail para receber as instruções de acesso.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="E-mail" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="voce@empresa.com" autoFocus {...register("email")} />
        </FormField>
        <Button type="submit" className="w-full" disabled={submitting}>
          <Mail className="size-4" />
          {submitting ? "Enviando..." : "Enviar recuperação"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Lembrou a senha? <Link className="text-accent hover:underline" to="/login">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
