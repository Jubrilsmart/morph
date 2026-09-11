'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Download, MonitorDown, Share, Smartphone, Monitor, X } from 'lucide-react'
import { toast } from 'sonner'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Platform = 'ios' | 'android' | 'desktop'

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIOS) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function InstallGuide({ platform }: { platform: Platform }) {
  return (
    <div className='flex flex-col gap-6 px-4 pb-2'>
      {platform === 'ios' && (
        <div className='flex flex-col gap-3'>
          <p className='text-sm text-muted-foreground'>
            iPhone and iPad don&apos;t support one-tap installs — use Safari&apos;s Share menu instead:
          </p>
          <ol className='flex flex-col gap-3 text-sm list-decimal list-inside'>
            <li className='flex items-center gap-2'>
              <span>Make sure you&apos;re in <strong>Safari</strong> (not an in-app browser).</span>
            </li>
            <li className='flex items-center gap-2'>
              <Share className='size-4 text-primary shrink-0' />
              <span>Tap the <strong>Share</strong> button in the toolbar (the square with an arrow).</span>
            </li>
            <li className='flex items-center gap-2'>
              <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
            </li>
            <li className='flex items-center gap-2'>
              <span>Confirm with <strong>Add</strong> — Morph will appear on your home screen and launch full-screen, even offline.</span>
            </li>
          </ol>
        </div>
      )}
      {platform === 'android' && (
        <div className='flex flex-col gap-3'>
          <p className='text-sm text-muted-foreground'>Install Morph on Android:</p>
          <ol className='flex flex-col gap-3 text-sm list-decimal list-inside'>
            <li>Tap the <strong>⋮ menu</strong> in Chrome.</li>
            <li>Tap <strong>Install app</strong> (or “Add to Home screen”).</li>
            <li>Confirm — Morph appears in your app drawer and works offline.</li>
          </ol>
        </div>
      )}
      {platform === 'desktop' && (
        <div className='flex flex-col gap-3'>
          <p className='text-sm text-muted-foreground'>Install Morph as a desktop app:</p>
          <ol className='flex flex-col gap-3 text-sm list-decimal list-inside'>
            <li className='flex items-center gap-2'>
              <MonitorDown className='size-4 text-primary shrink-0' />
              <span>In Chrome or Edge, click the <strong>install icon</strong> (screen with arrow) at the right end of the address bar.</span>
            </li>
            <li>Click <strong>Install</strong> in the prompt.</li>
            <li>Morph gets its own window, dock icon and offline access.</li>
          </ol>
        </div>
      )}
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Smartphone className='size-3.5' />
        Once installed, Morph runs entirely on your device — no internet needed.
      </div>
    </div>
  )
}

export default function InstallButton({
  label = 'Install',
  desktopLabel,
  variant = 'outline',
  size = 'default',
  className,
}: {
  label?: string
  desktopLabel?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'
  className?: string
}) {
  const [installable, setInstallable] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [guidePlatform, setGuidePlatform] = useState<Platform>('desktop')
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const promptHandler = (event: Event) => {
      event.preventDefault()
      deferredPromptRef.current = event as BeforeInstallPromptEvent
      setInstallable(true)
    }
    const installedHandler = () => {
      deferredPromptRef.current = null
      setInstallable(false)
      setInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', promptHandler)
    window.addEventListener('appinstalled', installedHandler)

    // Deferred so the standalone check doesn't run during the effect/commit phase
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled && isStandalone()) setInstalled(true)
    })

    return () => {
      cancelled = true
      window.removeEventListener('beforeinstallprompt', promptHandler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const handleClick = async () => {
    const deferredPrompt = deferredPromptRef.current
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        toast.success('Morph is installing…')
      }
      deferredPromptRef.current = null
      setInstallable(false)
      return
    }
    setGuidePlatform(detectPlatform())
    setGuideOpen(true)
  }

  if (installed) {
    return (
      <Button variant='outline' size={size} className={className} disabled>
        <Download />
        Installed
      </Button>
    )
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        aria-label={installable ? 'Install Morph' : 'How to install Morph'}
      >
        <Download />
        {desktopLabel ?? label}
      </Button>

      <Drawer open={guideOpen} onOpenChange={setGuideOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className='flex items-center gap-2'>
              <Monitor className='size-5 text-primary' />
              Install Morph
            </DrawerTitle>
            <DrawerDescription>
              Add Morph to your device for one-tap, offline-first access.
            </DrawerDescription>
            <DrawerClose
              render={
                <Button variant='ghost' size='icon' aria-label='Close' className='absolute right-4 top-4'>
                  <X />
                </Button>
              }
            />
          </DrawerHeader>
          <InstallGuide platform={guidePlatform} />
          <DrawerFooter>
            <DrawerClose render={<Button>Got it</Button>} />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
