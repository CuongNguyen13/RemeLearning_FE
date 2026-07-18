import { zodResolver } from "@hookform/resolvers/zod"
import { Camera, Loader2Icon } from "lucide-react"
import { useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { RevealGroup, RevealItem } from "@/components/Reveal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useUpdateProfile, useUploadProfilePhoto, useUserProfile } from "@/features/profile/hooks"
import { formatDate } from "@/lib/format"
import { ApiError } from "@/lib/http"
import { useAuthStore } from "@/stores/auth-store"

// Client-side guard so an oversized file doesn't round-trip to the server before failing.
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

type NameForm = { name: string }

// Derives up-to-two-letter initials from a display name, for the avatar fallback.
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const { data: profile } = useUserProfile(user?.userId ?? "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const nameSchema = z.object({ name: z.string().min(1, t("auth.nameRequired")) })
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    values: { name: user?.name ?? "" },
  })

  const updateProfile = useUpdateProfile(user?.userId ?? "")
  const uploadPhoto = useUploadProfilePhoto(user?.userId ?? "")

  if (!user) return null

  // Submits the display-name form; the session store and a toast are updated on success/failure.
  function onSubmit(values: NameForm) {
    updateProfile.mutate(values, {
      onSuccess: () => toast.success(t("profile.saveSuccess")),
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : t("profile.saveError"))
      },
    })
  }

  // Validates the picked file (type/size) before handing it to the upload mutation, so obviously
  // invalid files fail fast with an inline message instead of a round trip to the server.
  function onPhotoSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error(t("profile.photoInvalidType"))
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error(t("profile.photoTooLarge"))
      return
    }

    uploadPhoto.mutate(file, {
      onSuccess: () => toast.success(t("profile.photoSuccess")),
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : t("profile.photoError"))
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("profile.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("profile.subtitle")}</p>
      </div>

      <RevealGroup className="flex flex-col gap-6">
        {/* Identity summary - avatar, name, email - at a glance, nothing editable here. */}
        <RevealItem>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar size="lg" className="size-20 ring-4 ring-card">
                  <AvatarImage src={user.photoUrl ?? undefined} alt={user.name} />
                  <AvatarFallback className="bg-secondary text-xl text-secondary-foreground">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  aria-label={t("profile.changePhoto")}
                  aria-busy={uploadPhoto.isPending}
                  disabled={uploadPhoto.isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -right-1 -bottom-1 rounded-full border-2 border-card"
                >
                  {uploadPhoto.isPending ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <Camera className="size-3.5" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPhotoSelected}
                />
              </div>
              <div>
                <p className="font-heading text-lg font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </CardContent>
          </Card>
        </RevealItem>

        {/* Editable display name - the one form on this page. */}
        <RevealItem>
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.editName")}</CardTitle>
              <CardDescription>{t("profile.editNameDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                <FieldGroup>
                  <Field data-invalid={!!errors.name}>
                    <FieldLabel htmlFor="name">{t("auth.name")}</FieldLabel>
                    <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
                    <FieldError errors={[errors.name]} />
                  </Field>
                </FieldGroup>
                <Button
                  type="submit"
                  className="self-start"
                  disabled={!isDirty || updateProfile.isPending}
                  aria-busy={updateProfile.isPending}
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      {t("common.saving")}
                    </>
                  ) : (
                    t("common.save")
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </RevealItem>

        {/* Read-only account metadata, kept separate from the editable form above. */}
        <RevealItem>
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.accountDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/60 p-3">
                  <dt className="text-xs text-muted-foreground">{t("profile.role")}</dt>
                  <dd className="font-medium">{user.role}</dd>
                </div>
                <div className="rounded-2xl bg-muted/60 p-3">
                  <dt className="text-xs text-muted-foreground">{t("profile.memberSince")}</dt>
                  <dd className="font-medium">
                    {profile?.createdAt ? formatDate(profile.createdAt, i18n.language) : "–"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </RevealItem>
      </RevealGroup>
    </div>
  )
}
