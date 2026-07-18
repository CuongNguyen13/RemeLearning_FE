import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import { login } from "@/api/auth"
import { PasswordInput } from "@/components/PasswordInput"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/http"
import { useAuthStore } from "@/stores/auth-store"

type LoginForm = { email: string; password: string }

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.login)

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, t("auth.emailRequired")).email(t("auth.invalidEmail")),
        password: z.string().min(1, t("auth.passwordRequired")),
      }),
    [t]
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (auth) => {
      setSession(auth.token, auth.user)
      navigate("/", { replace: true })
    },
    onError: (error) => {
      // Only a genuine 401 means "wrong credentials" - a network drop or 5xx shouldn't
      // tell the learner their password is wrong, so those fall back to a generic message.
      const message =
        error instanceof ApiError && error.status === 401
          ? t("auth.loginFailed")
          : error instanceof ApiError
            ? error.message
            : t("common.somethingWentWrong")
      toast.error(message)
    },
  })

  return (
    <Card className="shadow-clay">
      <CardHeader>
        <CardTitle>{t("auth.loginTitle")}</CardTitle>
        <CardDescription>{t("auth.loginSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <FieldGroup>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">
                {t("auth.email")}
                <span aria-hidden="true" className="text-muted-foreground">
                  *
                </span>
              </FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                aria-invalid={!!errors.email}
                aria-required="true"
                aria-describedby={errors.email ? "login-email-error" : undefined}
                {...register("email")}
              />
              <FieldError
                id="login-email-error"
                errors={[errors.email]}
                className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200"
              />
            </Field>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">
                {t("auth.password")}
                <span aria-hidden="true" className="text-muted-foreground">
                  *
                </span>
              </FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-required="true"
                aria-describedby={errors.password ? "login-password-error" : undefined}
                {...register("password")}
              />
              <FieldError
                id="login-password-error"
                errors={[errors.password]}
                className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200"
              />
            </Field>
          </FieldGroup>
          <Button
            type="submit"
            disabled={mutation.isPending}
            aria-busy={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {mutation.isPending ? t("auth.loggingIn") : t("auth.loginButton")}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            {t("auth.signUp")}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
