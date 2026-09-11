"use client"

import * as React from "react"

import { useIsMobile } from "@/hooks/isMobile"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { ModeToggle } from "./toggle-button"
import InstallButton from "./InstallButton"

const navLinks = [
  { id: 1, name: 'Features', href: '/#features' },
  { id: 2, name: 'Tools', href: '/tools' },
  { id: 3, name: 'Formats', href: '/#formats' },
  { id: 4, name: 'FAQ', href: '/#faq' }
]

export function MobileDrawer() {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerTrigger render={<Button variant="secondary" aria-label="Open menu">
        <Menu />
      </Button>} />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Morph Menu</DrawerTitle>
          <DrawerClose render={<Button variant="ghost" size="icon" aria-label="Close menu" className="absolute right-4 top-4"><X /></Button>} />
        </DrawerHeader>
        <div className="flex-1 scroll-fade overflow-y-auto p-4">
          <div className="flex flex-col gap-6">
            {navLinks.map((l) => (
              <Button variant={'link'} key={l.id} render={<Link href={l.href} onClick={() => setOpen(false)} />}>
                {l.name}
              </Button>
            ))}
            <Button render={<Link href={'/tools'} onClick={() => setOpen(false)} />}>
              Start Converting
            </Button>
          </div>
        </div>
        <DrawerFooter>
          <div className="flex flex-col gap-2">
            <ModeToggle size={'lg'} />
            <InstallButton size={'lg'} />
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
