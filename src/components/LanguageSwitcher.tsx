import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
]

type LanguageSwitcherProps = {
  /** Visual context: `default` for light surfaces (header), `sidebar` for the dark
      sidebar — switches the trigger to a sidebar-tinted ghost button and flips the
      dropdown's alignment to the start so it stays inside the narrow rail. */
  variant?: "default" | "sidebar"
}

// Compact language picker. On the dark sidebar it renders as a full-width ghost button
// (label + icon) that reads as a global setting; in the header it stays the original
// icon-only circle. Both share the same dropdown of languages.
export function LanguageSwitcher({ variant = "default" }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()
  const isSidebar = variant === "sidebar"
  const current = LANGUAGES.find((lang) => i18n.resolvedLanguage === lang.code)
  const ariaLabel = t("common.changeLanguage", "Change language")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size={isSidebar ? "default" : "icon"}
            aria-label={ariaLabel}
            className={
              isSidebar
                ? "h-10 w-full justify-between gap-2 rounded-xl px-3 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                : "size-11 cursor-pointer"
            }
          />
        }
      >
        <Languages className={isSidebar ? "size-4" : undefined} aria-hidden="true" />
        {isSidebar && <span className="truncate">{current?.label ?? t("common.language", "Language")}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isSidebar ? "start" : "end"}>
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            data-active={i18n.resolvedLanguage === lang.code}
            className="data-[active=true]:font-medium data-[active=true]:text-primary"
            onClick={() => void i18n.changeLanguage(lang.code)}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
