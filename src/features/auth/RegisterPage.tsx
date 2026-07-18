import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import { register as registerUser } from "@/api/auth"
import { PasswordInput } from "@/components/PasswordInput"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/http"
import { useAuthStore } from "@/stores/auth-store"

type RegisterForm = { name: string; email: string; password: string }

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.login)

  const registerSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("auth.nameRequired")),
        email: z.string().min(1, t("auth.emailRequired")).email(t("auth.invalidEmail")),
        password: z.string().min(8, t("auth.passwordMin")),
      }),
    [t]
  )

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (auth) => {
      setSession(auth.token, auth.user)
      navigate("/", { replace: true })
    },
    onError: (error) => {
      const message =
        error instanceof ApiError && error.status === 409
          ? t("auth.emailTaken")
          : error instanceof ApiError
            ? error.message
            : t("common.somethingWentWrong")
      toast.error(message)
    },
  })

  return (
    <Card className="shadow-clay">
      <CardHeader>
        <CardTitle>{t("auth.registerTitle")}</CardTitle>
        <CardDescription>{t("auth.registerSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">
                {t("auth.name")}
                <span aria-hidden="true" className="text-muted-foreground">
                  *
                </span>
              </FieldLabel>
              <Input
                id="name"
                autoComplete="name"
                autoFocus
                aria-invalid={!!errors.name}
                aria-required="true"
                aria-describedby={errors.name ? "register-name-error" : undefined}
                {...registerField("name")}
              />
              <FieldError
                id="register-name-error"
                errors={[errors.name]}
                className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200"
              />
            </Field>
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
                aria-invalid={!!errors.email}
                aria-required="true"
                aria-describedby={errors.email ? "register-email-error" : undefined}
                {...registerField("email")}
              />
              <FieldError
                id="register-email-error"
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
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-required="true"
                aria-describedby={errors.password ? "register-password-error" : undefined}
                {...registerField("password")}
              />
              <FieldError
                id="register-password-error"
                errors={[errors.password]}
                className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200"
              />
            </Field>
          </FieldGroup>
          {/* Register is the "energetic, playful, motivating" surface (see PRODUCT.md); its
              submit button is the one place on this screen that spends the system's single
              warm accent, while Login stays on the calm trust-blue primary. */}
          <Button
            type="submit"
            disabled={mutation.isPending}
            aria-busy={mutation.isPending}
            className="w-full bg-accent-warm text-accent-warm-foreground hover:bg-accent-warm/85 focus-visible:border-accent-warm focus-visible:ring-accent-warm/40"
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {mutation.isPending ? t("auth.creatingAccount") : t("auth.registerButton")}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("auth.hasAccount")}{" "}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            {t("auth.signIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
