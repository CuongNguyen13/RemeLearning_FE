import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { AppSidebar } from "@/components/AppSidebar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogOverlay, DialogPortal, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// The persistent sidebar (AppSidebar) is hidden below the md breakpoint, so this is the
// mobile-only entry point into primary navigation: a hamburger trigger that opens the same
// nav content in a left-anchored drawer. Reuses the shared Dialog root/overlay for the
// backdrop and focus-trap behavior, but renders its own Popup (rather than the centered
// DialogContent) since a drawer needs different positioning and slide-in motion.
export function MobileNav() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("nav.openMenu")}
            className="size-11 md:hidden"
          />
        }
      >
        <Menu aria-hidden="true" />
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          data-slot="mobile-nav-content"
          className={cn(
            "fixed inset-y-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-sidebar text-sidebar-foreground shadow-2xl outline-none",
            "duration-200 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-left",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-left",
            "motion-reduce:animate-none motion-reduce:duration-0"
          )}
        >
          <DialogPrimitive.Close
            aria-label={t("nav.closeMenu")}
            className={cn(
              "absolute top-3 right-3 z-10 flex size-11 items-center justify-center rounded-full text-sidebar-foreground/75 outline-none",
              "transition-colors duration-150 ease-out hover:bg-sidebar-accent hover:text-sidebar-foreground motion-reduce:transition-none",
              "focus-visible:ring-3 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
            )}
          >
            <X className="size-5" aria-hidden="true" />
          </DialogPrimitive.Close>
          <AppSidebar className="flex" onNavigate={() => setOpen(false)} />
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  )
}
