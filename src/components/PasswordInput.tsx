import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"

type PasswordInputProps = React.ComponentProps<typeof Input>

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const { t } = useTranslation()

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className="pr-9" {...props} />
      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-9 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
